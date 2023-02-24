// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

// 云函数入口函数
exports.main = async (event, context) => {

  if(event.category == "food"){
    return await cloud
      .database()
      .collection("transaction")
      .add({
        data: {
          category: "food",
          sender: event.sender,
          receiver: event.receiver,
          amount: event.amount,
          foodOrder: event.order,
          screenshot: event.screenshot,
          category: "screenshotUSD",
          createTime: new Date(),
        },
      });
  }else{
    return await cloud
      .database()
      .collection("transaction")
      .add({
        data: {
          category: "reservation",
          sender: event.sender,
          receiver: event.receiver,
          amount: event.amount,
          service: event.service,
          screenshot: event.screenshot,
          category: "screenshotUSD",
          createTime: new Date(),
        },
      });
  }

  // //美元转账(有截图)
  // if (event.screenshot) {
  //   return await cloud
  //     .database()
  //     .collection("transaction")
  //     .add({
  //       data: {
  //         category: event.category,
  //         sender: event.sender,
  //         receiver: event.receiver,
  //         amount: event.amount,
  //         service: event.service || null,
  //         foodOrder: event.order || null,
  //         screenshot: event.screenshot,
  //         category: "screenshotUSD",
  //         createTime: new Date(),
  //       },
  //     });
  // }
  // //微信付款
  // else {
  //   return await cloud
  //     .database()
  //     .collection("transaction")
  //     .add({
  //       data: {
  //         sender: event.sender,
  //         receiver: event.receiver,
  //         amount: event.amount,
  //         service: event.service,
  //         category: "wechatCNY",
  //         createTime: new Date(),
  //       },
  //     });
  // }
};
