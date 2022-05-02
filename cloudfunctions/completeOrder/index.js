// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "jv-9gy6hgn177b0c873" });

// 云函数入口函数
exports.main = async (event, context) => {
  return await cloud
  .database()
  .collection("orders").doc(event.orderid).update({
    data: {
      status: "complete"
    },
  })
}