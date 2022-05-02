// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: "jv-9gy6hgn177b0c873" });

// 云函数入口函数
exports.main = async (event, context) => {
  //美元转账(有截图)
  if (event.screenshot) {
    return await cloud
      .database()
      .collection("transaction")
      .add({
        data: {
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
  //微信付款
  else {
    return await cloud
      .database()
      .collection("transaction")
      .add({
        data: {
          sender: event.sender,
          receiver: event.receiver,
          amount: event.amount,
          service: event.service,
          category: "wechatCNY",
          createTime: new Date(),
        },
      });
  }
};
