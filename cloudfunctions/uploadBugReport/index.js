// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("response").add({
    data:{
      content: event.content,
      type: event.type
  }})
}