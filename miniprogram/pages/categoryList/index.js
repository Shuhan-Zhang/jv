var util = require("../../utils/util");

Page({
  data: {
    allMerchants: [],
    loading: true,
  },
  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    let currentCategory = [options.category];
    switch(options.category){
      case "study":
        wx.setNavigationBarTitle({title: "学习类"})
        break
      case "service":
        wx.setNavigationBarTitle({title: "服务类"})
        currentCategory = ["service", "chef"]
        break
      case "entertainment":
        wx.setNavigationBarTitle({title: "娱乐类"})
        break
    }
    this.setData({
      category: currentCategory
    }); 
    this.getAllMerchants();
    wx.stopPullDownRefresh();
  },
  onReady: function (options) {
    this.setData({
      loading: false,
    });
    wx.hideLoading();
  },
  onPullDownRefresh: function () {
    this.onLoad(); //重新加载onLoad()
    wx.hideLoading();
  },

  async getAllMerchants(e) {
    var finalList = [];
    const db = wx.cloud.database();
    const _ = db.command;
    const res = await wx.cloud.database().collection("merchant").where({
      category: _.in(this.data.category),
    }).get();
    res.data.forEach(async (v) => {
      v.merchantData = await this.getUserData(v.leader);
      finalList.push(v);
      this.setData({
        allMerchants: finalList,
      });
    });
  },

  getUserData(userID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("user")
        .where({
          _id: userID,
        })
        .get()
        .then((res) => {
          resolve(res.data[0]);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  merchantNavigator(e) {
    wx.navigateTo({
      url: "/pages/merchantDetail/index?id=" + e.currentTarget.dataset.merchant,
    });
  },
  chefNavigator(e){
    wx.navigateTo({
      url: "/pages/chefDetail/index?id=" + e.currentTarget.dataset.merchant,
    });
  }
});