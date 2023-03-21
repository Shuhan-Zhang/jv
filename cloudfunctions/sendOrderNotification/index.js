// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
    try {
      let res = await cloud.openapi.subscribeMessage.send({
        touser: event.haoyouopenid,
        templateId: 'b0cVrk0vEvthUKTmqt7xV-31wgxUcC-beFDI5N4kkXc',
        page: event.url,
        lang: 'zh_CN',
        miniprogram_state: "developer",
        data: event.data,
      })
      console.log(res);
      return ("good", res)
    } catch (e) {
      console.log(e);
      return ("stupid", e)
    }
}