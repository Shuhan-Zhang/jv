var util = require("../../utils/util");

Page({
  data: {
    searchList: [],
    allMerchants: [],
    loading: true,
  },
  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    this.getAllMerchants();
  },
  onReady: function (options) {
    this.setData({
      loading: false,
    });
    wx.hideLoading();
  },

  async getAllMerchants(e) {
    var finalList = [];
    const res = await wx.cloud.database().collection("merchant").get();
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

  onClear(e) {
    this.setData({
      searchList: [],
      value: null,
      search: 0,
    });
  },
  search: function (e) {
    var value = e.detail;
    let db = wx.cloud.database();
    const _ = db.command;

    db.collection("merchant")
      .where(
        _.or([
          {
            title: {
              $regex: ".*" + value + ".*",
              $options: "1",
            },
          },
          {
            subTitle: {
              $regex: ".*" + value + ".*",
              $options: "1",
            },
          },
        ])
      )
      .get()
      .then((res) => {
        var finalList = res.data;
        if (finalList.length == 0) {
          this.setData({
            search: 1,
            searchList: [],
          });
        } else if (value && value.length > 0) {
          this.setData({
            searchList: finalList,
            search: 2,
          });
        } else {
          this.setData({
            finalList: [],
            search: 0,
          });
        }
        return new Promise((resolve, reject) => {
          resolve(finalList);
        });
      });
  },
  selectResult(e) {
    wx.navigateTo({
      url: "/pages/merchantDetail/index?id=" + e.currentTarget.dataset.id,
    });
  },
  merchantNavigator(e) {
    wx.navigateTo({
      url: "/pages/merchantDetail/index?id=" + e.currentTarget.dataset.merchant,
    });
  },
});
