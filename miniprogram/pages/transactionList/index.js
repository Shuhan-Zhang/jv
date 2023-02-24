Page({
  data: {},

  onLoad: function (options) {
    this.setData({
      openID: options.openid,
      cordID: options.cordid,
      storeID: options.storeid,
      options: options
    });
    this.getUserPayment(options.cordid);
    this.getPaymentReceived(options.cordid);
    wx.stopPullDownRefresh();
  },

  onReady: function () {},
  onPullDownRefresh: function () {
    this.onLoad(this.data.options); //重新加载onLoad()
    wx.hideLoading();
  },
  

  async getUserPayment(cordid) {
    const res = await wx.cloud
      .database()
      .collection("transaction")
      .where({
        sender: cordid,
      })
      .orderBy("createTime", "desc")
      .get();

    var allSent = [];
    res.data.forEach(async (v) => {
      const receiverData = await this.getUserData(v.receiver);
      v.createTime = this.formatTimeWithHours(new Date(v.createTime));
      v.receiverData = receiverData;
      allSent.push(v);
      this.setData({
        allSent: allSent,
      });
    });
  },

  async getPaymentReceived(cordid) {
    const res = await wx.cloud
      .database()
      .collection("transaction")
      .where({
        receiver: cordid,
      })
      .orderBy("createTime", "desc")
      .get();

    var allReceived = [];
    res.data.forEach(async (v) => {
      const senderData = await this.getUserData(v.sender);
      v.createTime = this.formatTimeWithHours(new Date(v.createTime));
      v.senderData = senderData;
      allReceived.push(v);
      this.setData({
        allReceived: allReceived,
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
  transactionNavigator(e) {
    wx.navigateTo({
      url:
        "/pages/transactionDetail/index?transactionid=" +
        e.currentTarget.dataset.transactionid,
    });
  },
});
