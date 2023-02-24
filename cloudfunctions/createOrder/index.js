// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

// 云函数入口函数
exports.main = async (event, context) => {
  if(event.category == "food"){
    return await cloud
    .database()
    .collection("orders")
    .add({
      data: {
        category: "food",
        merchant: event.merchant,
        participant: event.participant,
        transaction: event.transaction,
        foodOrder: event.order,
        status: event.status,
        createTime: new Date(),
        deliveryLocation: event.deliveryLocation
      },
    });
  }else{
    return await cloud
    .database()
    .collection("orders")
    .add({
      data: {
        category: "reservation",
        merchant: event.merchant,
        participant: event.participant,
        service: event.service,
        transaction: event.transaction,
        status: event.status,
        num: event.num,
        date: new Date(event.date),
        createTime: new Date(),
      },
    });
  }

};
