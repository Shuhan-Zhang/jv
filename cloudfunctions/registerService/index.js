// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("service").add({
    data:{
      merchant: event.merchant,
      picture: event.picture,
      CNYPrice: event.CNYPrice,
      USDPrice: event.USDPrice,
      serviceDescription: event.serviceDescription,
      serviceName: event.serviceName,
      serviceSubtitle: event.serviceSubtitle,
  }})
}