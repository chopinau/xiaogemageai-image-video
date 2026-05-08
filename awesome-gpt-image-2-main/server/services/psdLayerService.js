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
