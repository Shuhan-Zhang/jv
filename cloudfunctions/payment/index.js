// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

exports.main = async (event, context) => {
  const res = await cloud.cloudPay.unifiedOrder({
    "body" : event.title, //商品名称/描述
    "outTradeNo" : event.outTradeNo, //订单号(唯一)
    "spbillCreateIp" : "127.0.0.1", //后台终端
    "subMchId" : "1602234522", //商户号****,
    "totalFee" : event.price * 100, //支付金额,单位分
    "envId": "cord-4gtkoygbac76dbeb", //环境id
    "functionName": "pay_cb", //回调函数名称
  })
  return res
}