import crypto from 'crypto';
import fs from 'fs';
import axios from 'axios';
import paymentConfig from '../config/paymentConfig.js';

class WechatPayService {
  constructor() {
    this.config = paymentConfig.wechatPay;
    this.mchId = this.config.mchId;
    this.appId = this.config.appId;
    this.apiV3Key = this.config.apiV3Key;
    this.serialNo = this.config.serialNo;
  }

  buildAuthHeader(method, url, body = '') {
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
    const signature = this._sign(message);
    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`;
  }

  _sign(message) {
    const privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf8');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  _verifySign(data, signature) {
    const publicKey = fs.readFileSync(this.config.certPath, 'utf8');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }

  async createOrder(orderData) {
    const url = '/v3/pay/transactions/h5';
    const body = JSON.stringify({
      appid: this.appId,
      mchid: this.mchId,
      description: orderData.description,
      out_trade_no: orderData.outTradeNo,
      notify_url: this.config.notifyUrl,
      amount: { total: Math.round(orderData.amount * 100), currency: 'CNY' },
      scene_info: { payer_client_ip: orderData.clientIp || '127.0.0.1', h5_info: { type: 'Wap' } }
    });
    const authHeader = this.buildAuthHeader('POST', url, body);
    try {
      const response = await axios.post(`${this.config.apiBaseUrl}${url}`, body, {
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader, 'Accept': 'application/json' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async createNativeOrder(orderData) {
    const url = '/v3/pay/transactions/native';
    const body = JSON.stringify({
      appid: this.appId, mchid: this.mchId, description: orderData.description,
      out_trade_no: orderData.outTradeNo, notify_url: this.config.notifyUrl,
      amount: { total: Math.round(orderData.amount * 100), currency: 'CNY' }
    });
    const authHeader = this.buildAuthHeader('POST', url, body);
    try {
      const response = await axios.post(`${this.config.apiBaseUrl}${url}`, body, {
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader, 'Accept': 'application/json' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async queryOrder(outTradeNo) {
    const url = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${this.mchId}`;
    const authHeader = this.buildAuthHeader('GET', url);
    try {
      const response = await axios.get(`${this.config.apiBaseUrl}${url}`, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async refund(refundData) {
    const url = '/v3/refund/domestic/refunds';
    const body = JSON.stringify({
      out_trade_no: refundData.outTradeNo, out_refund_no: refundData.outRefundNo,
      amount: { refund: Math.round(refundData.refundAmount * 100), total: Math.round(refundData.totalAmount * 100), currency: 'CNY' },
      reason: refundData.reason || '用户申请退款'
    });
    const authHeader = this.buildAuthHeader('POST', url, body);
    try {
      const response = await axios.post(`${this.config.apiBaseUrl}${url}`, body, {
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader, 'Accept': 'application/json' }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  verifyNotify(body, headers) {
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const serial = headers['wechatpay-serial'];
    const signature = headers['wechatpay-signature'];
    if (serial !== this.serialNo) return false;
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    return this._verifySign(message, signature);
  }

  decryptNotify(associatedData, nonce, ciphertext) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.apiV3Key, nonce);
    decipher.setAuthTag(Buffer.from(ciphertext.slice(-16), 'base64'));
    let decrypted = decipher.update(ciphertext.slice(0, -16), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  async closeOrder(outTradeNo) {
    const url = `/v3/pay/transactions/out-trade-no/${outTradeNo}/close`;
    const body = JSON.stringify({ mchid: this.mchId });
    const authHeader = this.buildAuthHeader('POST', url, body);
    try {
      await axios.post(`${this.config.apiBaseUrl}${url}`, body, {
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader }
      });
      return { success: true };
    } catch { return { success: false }; }
  }
}

export default WechatPayService;
