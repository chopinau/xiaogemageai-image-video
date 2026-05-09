import { lingkeClient } from './lingkeClient.js';
import { taskManager } from '../utils/taskManager.js';
import { readPsd, writePsd } from 'ag-psd';
import sharp from 'sharp';

export class PsdLayerService {
  async processImage(imageBuffer, options = {}) {
    try {
      taskManager.emit('psd-progress', { step: 'upload', status: 'processing', message: '上传原图...' });

      const uploadResult = await lingkeClient.uploadImage(imageBuffer, 'original.png', 'image/png');
      if (!uploadResult.success) {
        return { success: false, error: '原图上传失败: ' + uploadResult.error };
      }
      const imageUrl = uploadResult.data?.url || uploadResult.data?.data?.url;
      if (!imageUrl) {
        return { success: false, error: '原图上传后未获取到URL' };
      }

      taskManager.emit('psd-progress', { step: 'remove-bg', status: 'processing', message: 'AI抠图中...' });

      const rmbgResult = await lingkeClient.removeBackground(imageUrl, options);
      if (!rmbgResult.success) {
        return { success: false, error: 'AI抠图失败: ' + rmbgResult.error };
      }

      let foregroundUrl;
      if (rmbgResult.data?.request_id) {
        foregroundUrl = await this._pollFalTask('bria/rmbg-1.4', rmbgResult.data.request_id);
        if (!foregroundUrl) {
          return { success: false, error: 'AI抠图任务超时或失败' };
        }
      } else {
        foregroundUrl = rmbgResult.data?.image_url || rmbgResult.data?.url || rmbgResult.data?.output?.image_url;
      }

      if (!foregroundUrl) {
        return { success: false, error: 'AI抠图未返回结果图片' };
      }

      taskManager.emit('psd-progress', { step: 'remove-bg', status: 'completed', message: 'AI抠图完成', foregroundUrl });

      taskManager.emit('psd-progress', { step: 'generate-mask', status: 'processing', message: '生成遮罩...' });

      const foregroundBuffer = await this._downloadImage(foregroundUrl);
      const maskBuffer = await this._generateMask(foregroundBuffer);

      const maskUploadResult = await lingkeClient.uploadImage(maskBuffer, 'mask.png', 'image/png');
      if (!maskUploadResult.success) {
        return { success: false, error: '遮罩上传失败: ' + maskUploadResult.error };
      }
      const maskUrl = maskUploadResult.data?.url || maskUploadResult.data?.data?.url;

      taskManager.emit('psd-progress', { step: 'inpaint', status: 'processing', message: 'AI补全背景中...' });

      const inpaintResult = await lingkeClient.inpaintBackground(imageUrl, maskUrl, options);
      if (!inpaintResult.success) {
        return { success: false, error: 'AI背景补全失败: ' + inpaintResult.error };
      }

      let backgroundUrl;
      if (inpaintResult.data?.request_id) {
        backgroundUrl = await this._pollFalTask('stable-diffusion/inpainting', inpaintResult.data.request_id);
        if (!backgroundUrl) {
          return { success: false, error: 'AI背景补全任务超时或失败' };
        }
      } else {
        backgroundUrl = inpaintResult.data?.image_url || inpaintResult.data?.url || inpaintResult.data?.output?.image_url;
      }

      if (!backgroundUrl) {
        return { success: false, error: 'AI背景补全未返回结果图片' };
      }

      taskManager.emit('psd-progress', { step: 'inpaint', status: 'completed', message: 'AI背景补全完成', backgroundUrl });

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'processing', message: '打包PSD文件...' });

      const backgroundBuffer = await this._downloadImage(backgroundUrl);
      const psdBuffer = await this._buildPSD(imageBuffer, foregroundBuffer, backgroundBuffer);

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'completed', message: 'PSD打包完成' });

      return {
        success: true,
        psdBuffer,
        filename: 'layered.psd',
        foregroundUrl,
        backgroundUrl,
        timestamp: Date.now()
      };
    } catch (err) {
      return { success: false, error: err.message || 'PSD分层处理异常' };
    }
  }

  async splitByColors(imageBuffer, options = {}) {
    const numColors = options.numColors || 5;
    const ignoreColor = options.ignoreColor || null;

    try {
      taskManager.emit('psd-progress', { step: 'analyze', status: 'processing', message: '分析图片颜色...' });

      const { data, info } = await sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const width = info.width;
      const height = info.height;
      const pixels = [];

      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const a = data[i * 4 + 3];
        if (a < 128) continue;
        if (ignoreColor === 'white' && r > 240 && g > 240 && b > 240) continue;
        if (ignoreColor === 'black' && r < 15 && g < 15 && b < 15) continue;
        pixels.push([r, g, b]);
      }

      if (pixels.length === 0) {
        return { success: false, error: '图片中没有有效像素' };
      }

      taskManager.emit('psd-progress', { step: 'cluster', status: 'processing', message: `颜色聚类中 (${numColors}色)...` });

      const centroids = this._kMeansInit(pixels, numColors);
      const assignments = new Int32Array(pixels.length);

      for (let iter = 0; iter < 20; iter++) {
        let changed = 0;
        for (let i = 0; i < pixels.length; i++) {
          let minDist = Infinity;
          let minIdx = 0;
          for (let c = 0; c < centroids.length; c++) {
            const dr = pixels[i][0] - centroids[c][0];
            const dg = pixels[i][1] - centroids[c][1];
            const db = pixels[i][2] - centroids[c][2];
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) {
              minDist = dist;
              minIdx = c;
            }
          }
          if (assignments[i] !== minIdx) {
            assignments[i] = minIdx;
            changed++;
          }
        }

        if (changed < pixels.length * 0.01) break;

        for (let c = 0; c < centroids.length; c++) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          for (let i = 0; i < pixels.length; i++) {
            if (assignments[i] === c) {
              sumR += pixels[i][0];
              sumG += pixels[i][1];
              sumB += pixels[i][2];
              count++;
            }
          }
          if (count > 0) {
            centroids[c] = [sumR / count, sumG / count, sumB / count];
          }
        }
      }

      taskManager.emit('psd-progress', { step: 'split', status: 'processing', message: '拆分图层...' });

      const layers = [];
      for (let c = 0; c < centroids.length; c++) {
        const layerData = Buffer.alloc(width * height * 4);
        layerData.fill(0);

        let pixelCount = 0;
        let pixIdx = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dataIdx = (y * width + x) * 4;
            const a = data[dataIdx + 3];
            if (a < 128) { pixIdx++; continue; }

            const pr = data[dataIdx];
            const pg = data[dataIdx + 1];
            const pb = data[dataIdx + 2];

            if (ignoreColor === 'white' && pr > 240 && pg > 240 && pb > 240) { pixIdx++; continue; }
            if (ignoreColor === 'black' && pr < 15 && pg < 15 && pb < 15) { pixIdx++; continue; }

            if (assignments[pixIdx] === c) {
              layerData[dataIdx] = pr;
              layerData[dataIdx + 1] = pg;
              layerData[dataIdx + 2] = pb;
              layerData[dataIdx + 3] = 255;
              pixelCount++;
            }
            pixIdx++;
          }
        }

        if (pixelCount < 100) continue;

        const layerBuffer = await sharp(layerData, {
          raw: { width, height, channels: 4 }
        })
          .png()
          .toBuffer();

        const uploadResult = await lingkeClient.uploadImage(layerBuffer, `layer_${c}.png`, 'image/png');
        const layerUrl = uploadResult.data?.url || uploadResult.data?.data?.url;

        const color = centroids[c];
        const hexColor = '#' +
          Math.round(color[0]).toString(16).padStart(2, '0') +
          Math.round(color[1]).toString(16).padStart(2, '0') +
          Math.round(color[2]).toString(16).padStart(2, '0');

        layers.push({
          name: `Layer_${hexColor}`,
          buffer: layerBuffer,
          url: layerUrl,
          color: hexColor,
          pixelCount
        });
      }

      layers.sort((a, b) => b.pixelCount - a.pixelCount);

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'processing', message: '打包PSD文件...' });

      const psdBuffer = await this._buildMultiLayerPSD(width, height, layers);

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'completed', message: 'PSD打包完成' });

      return {
        success: true,
        psdBuffer,
        filename: 'color-split.psd',
        layers: layers.map(l => ({ name: l.name, url: l.url, color: l.color, pixelCount: l.pixelCount })),
        layerCount: layers.length,
        timestamp: Date.now()
      };
    } catch (err) {
      return { success: false, error: err.message || '颜色拆层处理异常' };
    }
  }

  async assembleImages(imageBuffers, options = {}) {
    const layerNames = options.layerNames || [];
    const firstIsBackground = options.firstIsBackground !== false;

    try {
      taskManager.emit('psd-progress', { step: 'prepare', status: 'processing', message: '准备图层...' });

      const firstMeta = await sharp(imageBuffers[0]).metadata();
      const canvasWidth = options.width || firstMeta.width;
      const canvasHeight = options.height || firstMeta.height;

      const layers = [];
      for (let i = 0; i < imageBuffers.length; i++) {
        taskManager.emit('psd-progress', { step: 'process-layer', status: 'processing', message: `处理图层 ${i + 1}/${imageBuffers.length}...` });

        const resized = await sharp(imageBuffers[i])
          .resize(canvasWidth, canvasHeight, { fit: options.fit || 'cover', position: 'center' })
          .ensureAlpha()
          .png()
          .toBuffer();

        const uploadResult = await lingkeClient.uploadImage(resized, `layer_${i}.png`, 'image/png');
        const layerUrl = uploadResult.data?.url || uploadResult.data?.data?.url;

        layers.push({
          name: layerNames[i] || (i === 0 && firstIsBackground ? 'Background' : `Layer_${i + 1}`),
          buffer: resized,
          url: layerUrl
        });
      }

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'processing', message: '打包PSD文件...' });

      const psdBuffer = await this._buildMultiLayerPSD(canvasWidth, canvasHeight, layers);

      taskManager.emit('psd-progress', { step: 'build-psd', status: 'completed', message: 'PSD打包完成' });

      return {
        success: true,
        psdBuffer,
        filename: 'assembled.psd',
        layers: layers.map(l => ({ name: l.name, url: l.url })),
        layerCount: layers.length,
        canvasWidth,
        canvasHeight,
        timestamp: Date.now()
      };
    } catch (err) {
      return { success: false, error: err.message || '多图组装处理异常' };
    }
  }

  _kMeansInit(pixels, k) {
    const centroids = [];
    const step = Math.floor(pixels.length / k);
    for (let i = 0; i < k; i++) {
      centroids.push([...pixels[i * step]]);
    }
    return centroids;
  }

  async _buildMultiLayerPSD(width, height, layers) {
    const children = [];

    for (const layer of layers) {
      const { data } = await sharp(layer.buffer)
        .resize(width, height, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      children.push({
        name: layer.name,
        canvas: {
          width,
          height,
          data,
          getContext: () => null
        }
      });
    }

    const psd = { width, height, children };
    const psdBuffer = writePsd(psd);
    return Buffer.from(psdBuffer);
  }

  async _pollFalTask(modelName, requestId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      await this._sleep(3000);
      const result = await lingkeClient.queryFluxTask(modelName, requestId);
      if (!result.success) continue;

      const status = result.data?.status;
      if (status === 'COMPLETED' || status === 'completed') {
        return result.data?.image_url || result.data?.output?.image_url || result.data?.images?.[0]?.url;
      }
      if (status === 'FAILED' || status === 'failed') {
        return null;
      }
    }
    return null;
  }

  async _generateMask(foregroundBuffer) {
    const { data, info } = await sharp(foregroundBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const maskData = Buffer.alloc(info.width * info.height);
    for (let i = 0; i < info.width * info.height; i++) {
      const alphaIndex = i * 4 + 3;
      maskData[i] = data[alphaIndex] > 128 ? 255 : 0;
    }

    const maskBuffer = await sharp(maskData, {
      raw: { width: info.width, height: info.height, channels: 1 }
    })
      .png()
      .toBuffer();

    return maskBuffer;
  }

  async _buildPSD(originalBuffer, foregroundBuffer, backgroundBuffer) {
    const originalMeta = await sharp(originalBuffer).metadata();
    const width = originalMeta.width;
    const height = originalMeta.height;

    const bgResized = await sharp(backgroundBuffer)
      .resize(width, height, { fit: 'fill' })
      .png()
      .toBuffer();

    const fgResized = await sharp(foregroundBuffer)
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .png()
      .toBuffer();

    const bgImageData = await this._pngToRawData(bgResized, width, height);
    const fgImageData = await this._pngToRawData(fgResized, width, height);

    const psd = {
      width,
      height,
      children: [
        {
          name: 'Background',
          canvas: bgImageData
        },
        {
          name: 'Foreground',
          canvas: fgImageData
        }
      ]
    };

    const psdBuffer = writePsd(psd);
    return Buffer.from(psdBuffer);
  }

  async _pngToRawData(pngBuffer, width, height) {
    const { data } = await sharp(pngBuffer)
      .resize(width, height, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      width,
      height,
      data,
      getContext: () => null
    };
  }

  async _downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载图片失败: HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const psdLayerService = new PsdLayerService();
