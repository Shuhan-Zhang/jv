var util = require("../../utils/util");

Page({
  data: {
    searchList: [],
    allMerchants: [],
    sliders:[],
    loading: true,
    cordID: wx.getStorageSync('CordID'),
    focus: false,
    showResult: false
  },
  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    this.getAllMerchants();
    this.getSlider();
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
    const res = await wx.cloud.database().collection("merchant").get();
    res.data.forEach(async (v) => {
      v.merchantData = await this.getUserData(v.leader);
      finalList.push(v);
      this.setData({
        allMerchants: finalList,
      });
    });
  },
  
  async getSlider(e){
    const res = await wx.cloud.database().collection("slider").get();
    this.setData({
      sliders: res.data,
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
  merchantNavigator(e) {
    if(e.currentTarget.dataset.category == "chef"){
      wx.navigateTo({
        url: "/pages/chefDetail/index?id=" + e.currentTarget.dataset.merchant,
      });
    }else{
      wx.navigateTo({
        url: "/pages/merchantDetail/index?id=" + e.currentTarget.dataset.merchant,
      });
    }
  },
  swiperNavigator(e){
    if(!this.data.cordID){
      wx.showToast({
        title: '请先注册/登陆',
      })
    }
    wx.navigateTo({
      url: e.currentTarget.dataset.url,
    });
  },
  categoryNavigator(e){
    wx.navigateTo({
      url: "/pages/categoryList/index?category=" + e.currentTarget.dataset.category,
    });
  }
});