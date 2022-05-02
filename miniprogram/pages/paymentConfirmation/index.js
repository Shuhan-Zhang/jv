Page({
  data: {
    option: [
      { text: "微信支付", value: 0 },
      { text: "美元转账", value: 1 },
    ],
    value: 0,
    num: 1,
  },

  onLoad: function (options) {
    this.setData({
      serviceID: options.serviceid,
      merchantID: options.merchantid,
    });
    this.getServiceData(options.serviceid);
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
      price: res.data.CNYPrice,
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

  changeDropdown(e) {
    //微信支付
    if (e.detail == 0) {
      this.setData({
        price: this.data.serviceData.CNYPrice * this.data.num,
      });
    }
    //美元转账
    else {
      this.setData({
        price: this.data.serviceData.USDPrice * this.data.num,
      });
    }
    this.setData({
      value: e.detail,
    });
  },

  onNumberChange(e) {
    this.setData({
      num: e.detail,
    });

    //微信支付人民币
    if (this.data.value == 0) {
      this.setData({
        price: this.data.serviceData.CNYPrice * e.detail,
      });
    }
    //美元转账
    else {
      this.setData({
        price: this.data.serviceData.USDPrice * e.detail,
      });
    }
  },

  payment(e) {
    //微信支付人民币
    if (this.data.value == 0) {
      wx.showToast({
        title: "微信支付",
      });
    }
    //美元转账
    else {
      wx.navigateTo({
        url:
          "/pages/transferConfirmation/index?serviceid=" +
          this.data.serviceData._id +
          "&amount=" +
          this.data.price,
      });
    }
  },
});
