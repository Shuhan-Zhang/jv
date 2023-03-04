Page({
  data: {
    show: false,
    transactionID: "",
    cordID: wx.getStorageSync("CordID"),
  },

  onLoad: function (options) {
    this.setData({
      transactionID: options.transactionid,
      options: options
    });
    this.getTransactionData(options.transactionid);
    wx.stopPullDownRefresh();
  },
  onPullDownRefresh: function () {
    this.onLoad(this.data.options); //重新加载onLoad()
    wx.hideLoading();
  },
  async getTransactionData(transactionID) {
    var res = await wx.cloud
      .database()
      .collection("transaction")
      .doc(transactionID)
      .get();

    res.data.createTime = this.formatTimeWithHours(
      new Date(res.data.createTime)
    );
    res.data.amount = parseFloat(res.data.amount).toFixed(2);

    this.getOrderData(transactionID);
    const senderData = await this.getUserData(res.data.sender);
    const receiverData = await this.getUserData(res.data.receiver);

    this.setData({
      transactionData: res.data,
      senderData: senderData,
      receiverData: receiverData,
    });
  },

  async getOrderData(transactionID) {
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        transaction: transactionID,
      })
      .get();

    this.setData({
      orderData: res.data[0],
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
  enlarge(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: [e.currentTarget.dataset.url],
    });
  },

  orderNavigator(e) {
    wx.navigateTo({
      url:
        "/pages/orderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
    });
  },
  async reUpload(e) {
    const uploadRes = await wx.chooseMedia({
      media: ["image"],
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
    })
    var tempPath = uploadRes.tempFiles[0].tempFilePath;
    wx.showLoading({
      title: "更新中",
    });
    var screenshotID = Date.now() + "Transaction.jpg";
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: screenshotID,
        filePath: tempPath,
      });
      await wx.cloud.callFunction({
        name: "updateScreenshot",
        data: {
          transactionid: this.data.transactionData._id,
          url: res.fileID,
        },
      });
    } catch (err) {
      console.log(err);
      wx.showToast({
        title: "更新失败",
        icon: "error",
      });
    }
    this.onLoad({ transactionid: this.data.transactionID });
    this.onClose();
    wx.hideLoading();
    wx.showToast({
      title: "更新成功",
      icon: "success",
    });
  },

  onClose() {
    this.setData({
      show: false,
    });
  },
  async updateScreenshot() {
    wx.showLoading({
      title: "更新中",
    });
    var screenshotID = Date.now() + "Transaction.jpg";
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: screenshotID,
        filePath: this.data.tempPath,
      });
      await wx.cloud.callFunction({
        name: "updateScreenshot",
        data: {
          transactionid: this.data.transactionData._id,
          url: res.fileID,
        },
      });
    } catch (err) {
      console.log(err);
      wx.showToast({
        title: "更新失败",
        icon: "error",
      });
    }
    this.onLoad({ transactionid: this.data.transactionID });
    this.onClose();
    wx.hideLoading();
    wx.showToast({
      title: "更新成功",
      icon: "success",
    });
  },
});
