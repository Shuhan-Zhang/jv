// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cord-4gtkoygbac76dbeb" });

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("merchant").doc(event.merchantID).update({
    data:{
      availableTimes: event.availableTimes,
      billboard: event.detailInfo,
      category: event.category,
      coverPic: event.coverpic,
      locationDetail: event.locationDetail,
      locationName: event.locationName,
      lowestPrice: event.lowestPrice,
      paymentInfo: event.paymentMethod,
      longitude: event.longitude,
      latitude: event.latitude,
      subPic: event.detailpic,
      title: event.name,
  }})
}