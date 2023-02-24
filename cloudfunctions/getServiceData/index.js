// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cord-4gtkoygbac76dbeb" });
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  data = await db.collection('service').doc(event.serviceID).get();

  return {
    data
  }
}