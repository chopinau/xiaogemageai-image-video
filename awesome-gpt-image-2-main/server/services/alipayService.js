import crypto from 'crypto';
import querystring from 'querystring';
import axios from 'axios';
import paymentConfig from '../config/paymentConfig.js';

class AlipayService {
  constructor() {
    this.config = paymentConfig.alipay;
  }

  sign(params) {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const privateKey = this.config.privateKey.replace(/-----BEGIN RSA PRIVATE KEY-----/, '').replace(/-----END RSA PRIVATE KEY-----/, '').replace(/\n/g, '');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  verifySign(params, sign) {
    const sortedKeys = Object.keys(params).filter(k => k !== 'sign' && k !== 'sign_type').sort();
    const verifyStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const publicKey = this.config.alipayPublicKey.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\n/g, '');
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(verifyStr);
    verify.end();
    return verify.verify(publicKey, sign, 'base64');
  }

  buildCommonParams(method, bizContent) {
    return {
      app_id: this.config.appId, method, format: this.config.format, charset: this.config.charset,
      sign_type: this.config.signType, timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, '+08:00'),
      version: this.config.version, biz_content: JSON.stringify(bizContent)
    };
  }

  async createWebOrder(orderData) {
    const bizContent = {
      out_trade_no: orderData.outTradeNo, total_amount: orderData.amount.toFixed(2),
      subject: orderData.subject || '积分充值', body: orderData.body || `充值 ${orderData.credits} 积分`,
      product_code: 'FAST_INSTANT_TRADE_PAY', timeout_express: orderData.timeout || '30m',
      passback_params: JSON.stringify({ userId: orderData.userId })
    };
    const params = this.buildCommonParams('alipay.trade.page.pay', bizContent);
    params.notify_url = this.config.notifyUrl;
    params.return_url = this.config.returnUrl;
    params.sign = this.sign(params);
    const queryString = querystring.stringify(params);
    return { success: true, payUrl: `${this.config.gatewayUrl}?${queryString}` };
  }

  async createWapOrder(orderData) {
    const bizContent = {
      out_trade_no: orderData.outTradeNo, total_amount: orderData.amount.toFixed(2),
      subject: orderData.subject || '积分充值', product_code: 'QUICK_WAP_WAY', timeout_express: orderData.timeout || '30m'
    };
    const params = this.buildCommonParams('alipay.trade.wap.pay', bizContent);
    params.notify_url = this.config.notifyUrl;
    params.return_url = this.config.returnUrl;
    params.sign = this.sign(params);
    const queryString = querystring.stringify(params);
    return { success: true, payUrl: `${this.config.gatewayUrl}?${queryString}` };
  }

  async createQrOrder(orderData) {
    const bizContent = {
      out_trade_no: orderData.outTradeNo, total_amount: orderData.amount.toFixed(2),
      subject: orderData.subject || '积分充值', product_code: 'FACE_TO_FACE_PAYMENT', timeout_express: orderData.timeout || '30m'
    };
    const params = this.buildCommonParams('alipay.trade.precreate', bizContent);
    params.notify_url = this.config.notifyUrl;
    params.sign = this.sign(params);
    try {
      const response = await axios.post(this.config.gatewayUrl, querystring.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return { success: true, data: response.data.alipay_trade_precreate_response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async queryOrder(outTradeNo) {
    const bizContent = { out_trade_no: outTradeNo };
    const params = this.buildCommonParams('alipay.trade.query', bizContent);
    params.sign = this.sign(params);
    try {
      const response = await axios.post(this.config.gatewayUrl, querystring.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return { success: true, data: response.data.alipay_trade_query_response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async refund(refundData) {
    const bizContent = {
      out_trade_no: refundData.outTradeNo, out_request_no: refundData.outRequestNo,
      refund_amount: refundData.refundAmount.toFixed(2), refund_reason: refundData.reason || '用户申请退款'
    };
    const params = this.buildCommonParams('alipay.trade.refund', bizContent);
    params.sign = this.sign(params);
    try {
      const response = await axios.post(this.config.gatewayUrl, querystring.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return { success: true, data: response.data.alipay_trade_refund_response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async closeOrder(outTradeNo) {
    const bizContent = { out_trade_no: outTradeNo };
    const params = this.buildCommonParams('alipay.trade.close', bizContent);
    params.sign = this.sign(params);
    try {
      await axios.post(this.config.gatewayUrl, querystring.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  verifyNotify(body) {
    const params = {};
    const pairs = body.split('&');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) params[key] = decodeURIComponent(value);
    });
    const sign = params.sign;
    delete params.sign;
    delete params.sign_type;
    return this.verifySign(params, sign);
  }
}

export default AlipayService;
