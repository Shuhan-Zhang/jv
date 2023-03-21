Page({
    data: {
        openid: wx.getStorageSync('openid'),
        userInfo: wx.getStorageSync('userInfo'),
        value: 0,
        num: 1,
        file: "",
        openid: wx.getStorageSync("openid"),
        cordid: wx.getStorageSync("CordID"),
        userLocation: ""
    },

    onLoad: function(options) {
        this.setData({
            merchantID: options.merchantid,
            order: JSON.parse(options.order),
            total: options.total
        });
        this.getMerchantData(options.merchantid);
    },

    async getServiceData(serviceID) {
        const res = await wx.cloud
            .database()
            .collection("service")
            .doc(serviceID)
            .get();

        await this.getMerchantData(res.data.merchant);
        await this.getPreviousAppointmentTime(res.data.merchant);

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

    onChangeLocation(e){
      this.setData({
        userLocation: e.detail
      })
    },

    upload(e) {
        wx.chooseMedia({
                media: ["image"],
                count: 1,
                sizeType: ["original", "compressed"],
                sourceType: ["album", "camera"],
            })
            .then((res) => {
                console.log(res);
                this.setData({
                    file: res.tempFiles[0].tempFilePath,
                });
            })
            .catch((err) => {
                wx.showToast({
                    title: "上传失败",
                    icon: "error",
                });
            });
    },
    enlarge(e) {
        wx.previewImage({
            current: e.currentTarget.dataset.url,
            urls: [e.currentTarget.dataset.url],
        });
    },
    uploadFilePromise(fileName, chooseResult) {
        return wx.cloud.uploadFile({
            cloudPath: fileName,
            filePath: chooseResult.url
        });
    },

    async submitOrder(e) {
      if(this.data.userLocation.length == 0){
        wx.showToast({
          title: '请输入送餐地址',
          icon: 'none'
        })
        return;
      }
      let subscribeRes = await wx.requestSubscribeMessage({
        tmplIds: ["t99WD8_SUi4kmPcRHhAC_ZMcwZDTCGMzm4MvdC66W6E"]});
      console.log(subscribeRes);
        wx.showLoading({
            title: "创建订单中"
        });

        var screenshotID = Date.now() + "Transaction.jpg";

        try {
            const res = await wx.cloud.uploadFile({
                cloudPath: screenshotID,
                filePath: this.data.file,
            });

            const transactionRes = await wx.cloud.callFunction({
                name: "createTransaction",
                data: {
                    category: "food",
                    sender: this.data.cordid,
                    receiver: this.data.merchantData.leader,
                    amount: this.data.total,
                    order: this.data.order,
                    screenshot: res.fileID,
                },
            });

            const orderRes = await wx.cloud.callFunction({
                name: "createOrder",
                data: {
                    category: "food",
                    merchant: this.data.merchantData._id,
                    participant: this.data.cordid,
                    transaction: transactionRes.result._id,
                    order: this.data.order,
                    status: "pending",
                    deliveryLocation: this.data.userLocation
                },
            });
            wx.hideLoading({});
            if (orderRes.result._id) {
                wx.showToast({
                    title: "订单创建成功",
                    icon: "success",
                }).then((res) => {
                    wx.reLaunch({
                        url: "/pages/foodOrderDetail/index?orderid=" + orderRes.result._id,
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