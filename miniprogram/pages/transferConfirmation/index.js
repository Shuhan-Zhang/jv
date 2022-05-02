Page({
  data: {
    file: "",
    openid: wx.getStorageSync("openid"),
    cordid: wx.getStorageSync("CordID"),
  },

  onLoad: function (options) {
    wx.showLoading({
      title: "加载中",
    });
    this.setData({
      price: options.amount,
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

  upload(e) {
    wx.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
    })
      .then((res) => {
        this.setData({
          file: res.tempFilePaths[0],
        });
      })
      .catch((err) => {
        wx.showToast({
          title: "上传失败",
        });
      });
  },
  deleteUpload(e) {
    this.setData({
      file: "",
    });
  },
  enlarge(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: [e.currentTarget.dataset.url],
    });
  },

  async confirmUpload(e) {
    var screenshotID = Date.now() + "Transaction.jpg";
    wx.showLoading({
      title: "创建订单中",
    });
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: screenshotID,
        filePath: this.data.file,
      });

      const transactionRes = await wx.cloud.callFunction({
        name: "createTransaction",
        data: {
          sender: this.data.cordid,
          receiver: this.data.merchantData.leader,
          amount: this.data.price,
          service: this.data.serviceData._id,
          screenshot: res.fileID,
        },
      });
      if (!transactionRes.result._id) {
        throw "no transaction id";
      }

      const orderRes = await wx.cloud.callFunction({
        name: "createOrder",
        data: {
          merchant: this.data.merchantData._id,
          participant: this.data.cordid,
          service: this.data.serviceData._id,
          transaction: transactionRes.result._id,
          num: this.data.num,
          status: "pending",
        },
      });

      wx.hideLoading({});
      if (orderRes.result._id) {
        wx.showToast({
          title: "订单创建成功",
          icon: "success",
        }).then((res) => {
          wx.reLaunch({
            url: "/pages/orderDetail/index?orderid=" + orderRes.result._id,
          });
        });
      } else {
        throw "failed";
      }
    } catch (err) {
      console.log(err);
      wx.showToast({
        title: "订单创建失败",
        icon: "error",
      });
    }
  },
});
