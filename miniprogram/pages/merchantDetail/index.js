Page({
  data: {
    loading: true,
  },

  onLoad: function (options) {
    wx.showLoading({
      title: "加载商家中",
    });
    this.getMerchantData(options.id);
  },
  onReady: function (options) {
    wx.hideLoading();
    this.setData({
      loading: false,
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
    const serviceData = await this.getServiceData(merchantData._id);
    const participants = await this.getParticipants(merchantData._id);

    merchantData.leaderData = leaderData;

    this.setData({
      merchantData: merchantData,
      serviceData: serviceData,
      participantNumber: participants.length,
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
  getServiceData(merchantID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("service")
        .where({
          merchant: merchantID,
        })
        .orderBy("price", "asc")
        .get()
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getParticipants(merchantID) {
    return new Promise((resolve, reject) => {
      wx.cloud
        .database()
        .collection("orders")
        .where({
          merchant: merchantID,
        })
        .get()
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  enlarge(e) {
    console.log(e.currentTarget.dataset.url);
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.merchantData.subPic,
    });
  },
  serviceDetailNavigator(e) {
    console.log(e);
    wx.navigateTo({
      url:
        "/pages/serviceDetail/index?serviceid=" +
        e.currentTarget.dataset.serviceid,
    });
  },
});
