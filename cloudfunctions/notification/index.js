// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let res = await cloud.openapi.subscribeMessage.send({
      touser: event.haoyouopenid,
      page: 'pages/friendList/index',
      lang: 'zh_CN',
      data: event.data,
      templateId: 'b0cVrk0vEvthUKTmqt7xV-31wgxUcC-beFDI5N4kkXc',
    })
    return ("good", res)
  } catch (e) {
    return ("stupid", e)
  }
}