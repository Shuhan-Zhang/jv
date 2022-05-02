// pages/user/index.js
Page({
  data: {
    loginStatus: false,
    userInfo: {},
    loading: true,
  },
  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    //problem
    wx.getStorage({
      key: "openid"
    }).then(res=>{
      this.setData({
        openid: res.data
      });
      this.getUserInfo(res.data);
    }).catch(err=>{
      wx.cloud
      .callFunction({
        name: "getOpenid",
      }).then(res=>{
        console.log(res);
      })
    })
  },
  onReady() {
    var that = this;
    setTimeout(function () {
      that.setData({
        loading: false,
      });
    }, 1000);

    wx.hideLoading({});
  },

  async getUserOrders(storeID) {
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        merchant: storeID,
      })
      .orderBy("createTime", "desc")
      .limit(3)
      .get();

    var allOrderData = [];
    res.data.forEach(async (v) => {
      const serviceData = await this.getServiceData(v.service);
      const participantData = await this.getUserData(v.participant);
      const merchantData = await this.getMerchantData(v.merchant);
      const transactionData = await this.getTransactionData(v.transaction);
      const createTime = this.formatTimeWithHours(new Date(v.createTime));
      v.serviceData = serviceData;
      v.createTime = createTime;
      v.transactionData = transactionData;
      v.participantData = participantData;
      v.merchantData = merchantData;
      allOrderData.push(v);
      this.setData({
        orders: allOrderData,
      });
    });
  },

  async getUserParticipations(cordid) {
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        participant: cordid,
      })
      .orderBy("createTime", "desc")
      .limit(3)
      .get();

    var alParticipations = [];
    res.data.forEach(async (v) => {
      const serviceData = await this.getServiceData(v.service);
      const participantData = await this.getUserData(v.participant);
      const merchantData = await this.getMerchantData(v.merchant);
      const transactionData = await this.getTransactionData(v.transaction);
      v.serviceData = serviceData;
      v.participantData = participantData;
      v.merchantData = merchantData;
      v.transactionData = transactionData;
      alParticipations.push(v);
      this.setData({
        participations: alParticipations,
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

  getServiceData(serviceID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("service")
        .doc(serviceID)
        .get()
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getMerchantData(merchantID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("merchant")
        .doc(merchantID)
        .get()
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  async getTransactionData(transactionID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("transaction")
        .doc(transactionID)
        .get()
        .then((res) => {
          res.data.createTime = this.formatTimeWithHours(
            new Date(res.data.createTime)
          );
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getUserInfo(id) {
    wx.cloud
      .database()
      .collection("user")
      .where({
        openid: id,
      })
      .get()
      .then((res) => {
        var userInfo = res.data[0];
        //更新用户登陆状态
        var status = userInfo != 0;
        this.setData({
          loginStatus: status,
        });
        wx.setStorageSync("loginStatus", status);

        //更新用户信息
        this.setData({
          userInfo: userInfo,
        });
        wx.setStorageSync("userInfo", res.data[0]);

        //更新CORD ID
        wx.setStorageSync("CordID", res.data[0]._id);

        //更新页面数据
        if (userInfo.store.length != 0) {
          this.getUserOrders(userInfo.store);
        }
        this.getUserParticipations(userInfo._id);
      })
      .catch((err) => {
        console.log("error loading user", err);
      });
  },

  login(e) {
    wx.getUserProfile({
      desc: "服务购买以及管理",
    })
      .then((res) => {
        wx.showLoading({
          title: "注册中",
        });
        wx.cloud
          .callFunction({
            name: "registerUser",
            data: {
              profilePic: res.userInfo.avatarUrl,
              username: res.userInfo.nickName,
              phoneNumber: 15901531635,
              openid: this.data.openid,
            },
          })
          .then((res) => {
            wx.hideLoading();
            wx.showToast({
              title: "成功注册",
              icon: "success",
              duration: 1500,
            }).then((res) => {
              this.setData({
                loginStatus: true,
              });
              wx.switchTab({
                url: "/pages/user/index"
              })
            });
          });
      })
      .catch((err) => {
        console.log("login error", err);
        wx.showToast({
          title: "登录错误",
          icon: "none",
        });
      });
  },

  error(e) {
    wx.navigateTo({
      url: "/pages/error/index",
    });
  },
  suggestion(e) {
    wx.navigateTo({
      url: "/pages/suggestion/index",
    });
  },
  developer(e) {
    wx.navigateTo({
      url: "/pages/developer/index",
    });
  },
  viewHistory(e) {
    wx.navigateTo({
      url:
        "/pages/orderList/index?cordid=" +
        this.data.userInfo._id +
        "&storeid=" +
        this.data.userInfo.store +
        "&order=true" +
        "&participation=true" +
        "&complete=true" +
        "&rejected=true",
    });
  },

  viewTransactions(e) {
    wx.navigateTo({
      url:
        "/pages/transactionList/index?openid=" +
        this.data.userInfo._id +
        "&storeid=" +
        this.data.userInfo.store +
        "&cordid=" +
        this.data.userInfo._id,
    });
  },

  viewOrders() {
    wx.navigateTo({
      url:
        "/pages/orderList/index?cordid=" +
        this.data.userInfo._id +
        "&storeid=" +
        this.data.userInfo.store +
        "&order=true" +
        "&pending=true" +
        "&paid=true",
    });
  },
  viewParticipation() {
    wx.navigateTo({
      url:
        "/pages/orderList/index?cordid=" +
        this.data.userInfo._id +
        "&storeid=" +
        this.data.userInfo.store +
        "&participation=true" +
        "&pending=true" +
        "&paid=true",
    });
  },

  orderNavigator(e) {
    wx.navigateTo({
      url:
        "/pages/orderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
    });
  },

  formatTimeWithHours(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    return (
      [year, month, day].map(this.formatNumber).join("/") +
      " " +
      [hour, minute].map(this.formatNumber).join(":")
    );
  },
  formatNumber(n) {
    n = n.toString();
    return n[1] ? n : "0" + n;
  },
});
