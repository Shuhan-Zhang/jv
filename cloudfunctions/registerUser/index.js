// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({env: 'jv-9gy6hgn177b0c873'})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  cloud.database().collection("user").add({
    data:{
      profilePic: event.profilePic,
      username: event.username,
      phoneNumber: event.phoneNumber,
      pastOrders: [],
      transactions: [],
      openid: event.openid
  }})
}