// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.database().collection("merchant").add({
    data:{
      availableTimes: event.availableTimes,
      availableTimesJson: [{"day":0,"endTime":0,"startTime":0},{"day":1,"endTime":0,"startTime":0},{"day":2,"endTime":0,"startTime":0},{"day":3,"endTime":0,"startTime":0},{"day":4,"endTime":0,"startTime":0},{"day":5,"endTime":0,"startTime":0},{"day":6,"endTime":0,"startTime":0}],
      billboard: event.detailInfo,
      category: event.category,
      coverPic: event.coverpic,
      leader: event.cordid,
      locationDetail: event.locationDetail,
      locationName: event.locationName,
      lowestPrice: event.lowestPrice,
      paymentInfo: event.paymentMethod,
      longitude: event.longitude,
      latitude: event.latitude,
      subPic: event.detailpic,
      title: event.name,
      approved: false
  }})
}