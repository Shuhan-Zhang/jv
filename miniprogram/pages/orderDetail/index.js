Page({
  data: {
    ifMerchant: false,
    cordID: wx.getStorageSync("CordID"),
    show: false,
    statusLoading: false,
    actions: [
      {
        name: "已拒绝",
        subname: "关闭订单",
        className: "actionOption",
      },
      {
        name: "待审核",
        subname: "订单未确定",
        className: "actionOption",
      },
      {
        name: "已确定",
        subname: "订单已付款确定",
        className: "actionOption",
      },
      {
        name: "已完成",
        subname: "订单已执行完毕",
        className: "actionOption",
      },
    ],
  },

  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    this.getOrderData(options.orderid);
    this.setData({
      orderID: options.orderid,
    });
  },
  onReady: function (options) {
    wx.hideLoading();
  },
  async getOrderData(orderID) {
    var orderData = await wx.cloud
      .database()
      .collection("orders")
      .doc(orderID)
      .get();

    orderData.data.createTime = this.formatTimeWithHours(
      new Date(orderData.data.createTime)
    );
    this.setData({
      orderData: orderData.data,
    });
    await this.getServiceData(orderData.data.service);
    await this.getMerchantData(orderData.data.merchant);
    await this.getParticipantData(orderData.data.participant);
    await this.getTransactionData(orderData.data.transaction);
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

    this.setData({
      transactionData: res.data,
    });
  },

  async getServiceData(serviceID) {
    const res = await wx.cloud
      .database()
      .collection("service")
      .doc(serviceID)
      .get();

    this.setData({
      serviceData: res.data,
    });
  },

  async getMerchantData(merchantID) {
    var ifMerchant = false;
    const res = await wx.cloud
      .database()
      .collection("merchant")
      .doc(merchantID)
      .get();

    var merchantData = res.data;

    const leaderData = await this.getUserData(merchantData.leader);

    merchantData.leaderData = leaderData;
    if (merchantData.leader == this.data.cordID) {
      ifMerchant = true;
    }

    this.setData({
      ifMerchant: ifMerchant,
      merchantData: merchantData,
    });
  },

  async getParticipantData(participantID) {
    const participantData = await this.getUserData(participantID);

    this.setData({
      participantData: participantData,
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
  transactionNavigator(e) {
    wx.navigateTo({
      url:
        "/pages/transactionDetail/index?transactionid=" +
        e.currentTarget.dataset.transactionid,
    });
  },
  serviceNavigator(e) {
    wx.navigateTo({
      url:
        "/pages/serviceDetail/index?serviceid=" +
        e.currentTarget.dataset.serviceid,
    });
  },
  async rejectOrder() {
    await wx.cloud
      .callFunction({
        name: "rejectOrder",
        data: {
          orderid: this.data.orderID,
        },
      })
      .then((res) => {
        console.log(res);
      });
  },
  approveOrder() {
    wx.cloud
      .callFunction({
        name: "approveOrder",
        data: {
          orderid: this.data.orderID,
        },
      })
      .then((res) => {
        console.log(res);
      });
  },
  pendingOrder() {
    wx.cloud
      .callFunction({
        name: "pendingOrder",
        data: {
          orderid: this.data.orderID,
        },
      })
      .then((res) => {
        console.log(res);
      });
  },
  completeOrder() {
    wx.cloud
      .callFunction({
        name: "completeOrder",
        data: {
          orderid: this.data.orderID,
        },
      })
      .then((res) => {
        console.log(res);
      });
  },
  changeStatus(e) {
    this.setData({ show: true });
  },
  onClose() {
    this.setData({ show: false });
  },

  async onSelect(event) {
    this.setData({
      statusLoading: true,
    });
    switch (event.detail.name) {
      case "已拒绝":
        await this.rejectOrder();
        break;
      case "待审核":
        await this.pendingOrder();
        break;
      case "已确定":
        await this.approveOrder();
        break;
      case "已完成":
        await this.completeOrder();
        break;
    }
    await this.getOrderData(this.data.orderID);
    this.onClose();
    this.setData({
      statusLoading: false,
    });
  },
});
