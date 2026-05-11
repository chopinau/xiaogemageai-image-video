const paymentConfig = {
  wechatPay: {
    mchId: process.env.WECHAT_MCH_ID || '',
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    apiV3Key: process.env.WECHAT_API_V3_KEY || '',
    serialNo: process.env.WECHAT_SERIAL_NO || '',
    privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH || './certs/apiclient_key.pem',
    certPath: process.env.WECHAT_CERT_PATH || './certs/apiclient_cert.pem',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payments/wechat/notify',
    refundNotifyUrl: process.env.WECHAT_REFUND_NOTIFY_URL || 'https://your-domain.com/api/payments/wechat/refund-notify',
    apiBaseUrl: 'https://api.mch.weixin.qq.com',
    sandboxApiBaseUrl: 'https://api.mch.weixin.qq.com/sandboxnew'
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gatewayUrl: 'https://openapi.alipay.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'https://your-domain.com/api/payments/alipay/notify',
    returnUrl: process.env.ALIPAY_RETURN_URL || 'https://your-domain.com/payments/success',
    signType: 'RSA2',
    charset: 'utf-8',
    format: 'JSON',
    version: '1.0'
  }
};

export default paymentConfig;
