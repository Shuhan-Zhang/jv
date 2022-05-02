Page({
  data: {},

  onLoad: function (options) {
    wx.showLoading({
      title: "加载服务细节中",
    });
    this.setData({
      serviceID: options.serviceid,
    });
    this.getServiceData(options.serviceid);
  },
  onReady: function (options) {
    wx.hideLoading();
  },

  async getServiceData(serviceID) {
    const res = await wx.cloud
      .database()
      .collection("service")
      .doc(serviceID)
      .get();

    await this.getMerchantData(res.data.merchant);

    this.setData({
      serviceData: res.data,
    });
  },

  async getMerchantData(merchantID) {
    const res = await wx.cloud
      .database()
      .collection("merchant")
      .doc(merchantID)
      .get();

    var merchantData = res.data;

    const leaderData = await this.getUserData(merchantData.leader);

    merchantData.leaderData = leaderData;

    this.setData({
      merchantData: merchantData,
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

  enlarge(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: [e.currentTarget.dataset.url],
    });
  },
  payment(e) {
    wx.navigateTo({
      url:
        "/pages/paymentConfirmation/index?serviceid=" +
        e.currentTarget.dataset.serviceid +
        "&merchantid=" +
        e.currentTarget.dataset.merchantid,
    });
  },
});
