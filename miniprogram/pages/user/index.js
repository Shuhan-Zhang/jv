// pages/user/index.js
Page({
    data: {
        loginStatus: wx.getStorageSync("loginStatus"),
        userInfo: {},
        loading: true,
        inStore: false
    },
    onLoad: function(options) {
        wx.showLoading({
            title: "加载中",
        });
        
        //problem
        wx.getStorage({
            key: "openid",
        })
        .then((res) => {
            this.setData({
                openid: res.data,
            });
            this.getUserInfo(res.data);
        })
        .catch((err) => {
            wx.cloud
                .callFunction({
                    name: "getOpenid",
                })
                .then((res) => {
                    console.log(res);
                });
        });
        wx.hideLoading({})
        wx.stopPullDownRefresh();
    },
    onShow(){
      this.onLoad();
    },
    onReady() {
        this.setData({
            loading: false,
        });
        wx.hideLoading({});
    },
    onPullDownRefresh() {
        this.onLoad();
        wx.hideLoading({});
    },


    async getUserOrders(storeID) {
        let db = wx.cloud.database();
        const _ = db.command;
        const res = await wx.cloud
            .database()
            .collection("orders")
            .where({
                merchant: storeID,
                date: _.gt(new Date()),
                status: _.not(_.eq("complete"))
            })
            .orderBy("date", "asc") 
            .limit(3)
            .get();
        // console.log(res)

        var allOrderData = [];
        res.data.forEach(async(v) => {
            const serviceData = await this.getServiceData(v.service);
            const participantData = await this.getUserData(v.participant);
            const merchantData = await this.getMerchantData(v.merchant);
            const transactionData = await this.getTransactionData(v.transaction);
            const createTime = this.formatTimeWithHours(new Date(v.createTime));
            const reservationDate = this.formatTimeWithHours(new Date(v.date));
            v.serviceData = serviceData;
            v.createTime = createTime;
            v.transactionData = transactionData;
            v.participantData = participantData;
            v.merchantData = merchantData;
            v.reservationDate = reservationDate;
            allOrderData.push(v);
            allOrderData.sort(function(a, b) {
                return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
            });
            this.setData({
                orders: allOrderData,
            });
        });
    },

    async getUserParticipations(cordid) {
        let db = wx.cloud.database();
        const _ = db.command;
        const res = await wx.cloud
            .database()
            .collection("orders")
            .where({
                participant: cordid,
                date: _.gt(new Date()),
                status: _.not(_.eq("complete"))
            })
            .orderBy("date", "asc")
            .limit(3)
            .get();
        
        var alParticipations = [];
        res.data.forEach(async(v) => {
            const serviceData = await this.getServiceData(v.service);
            const participantData = await this.getUserData(v.participant);
            const merchantData = await this.getMerchantData(v.merchant);
            const transactionData = await this.getTransactionData(v.transaction);
            const reservationDate = this.formatTimeWithHours(new Date(v.date));
            v.serviceData = serviceData;
            v.participantData = participantData;
            v.merchantData = merchantData;
            v.transactionData = transactionData;
            v.reservationDate = reservationDate;
            alParticipations.push(v);
            alParticipations.sort(function(a, b) {
                return a.date.getTime() - b.date.getTime()
            });
            this.setData({
                participations: alParticipations,
            });
        });
    },
    async getUserFoodParticipations(cordid) {
      let db = wx.cloud.database();
      const _ = db.command;
      const res = await wx.cloud
          .database()
          .collection("orders")
          .where({
              category: "food",
              participant: cordid,
              status: _.not(_.eq("complete"))
          })
          .orderBy("date", "asc")
          .limit(3)
          .get();
      
      console.log(res);
      var allFoodOrders = [];
      res.data.forEach(async(v) => {
          const participantData = await this.getUserData(v.participant);
          const merchantData = await this.getMerchantData(v.merchant);
          const transactionData = await this.getTransactionData(v.transaction);
          v.participantData = participantData;
          v.merchantData = merchantData;
          v.transactionData = transactionData;
          allFoodOrders.push(v);
          allFoodOrders.sort(function(a, b) {
              return a.createTime.getTime() - b.createTime.getTime()
          });
          this.setData({
              foodParticipations: allFoodOrders,
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
                var status = userInfo != undefined;
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
                    this.getUserMerchantData(userInfo.store);
                }
                this.getUserParticipations(userInfo._id);
                this.getUserFoodParticipations(userInfo._id);
            })
            .catch((err) => {
                console.log("error loading user", err);
            });
    },
    async getUserMerchantData(merchantID) {
      const res = await wx.cloud
        .database()
        .collection("merchant")
        .doc(merchantID)
        .get();
  
      var merchantData = res.data;
  
      const serviceData = await this.getMerchantServiceData(merchantData._id);
      const participants = await this.getParticipants(merchantData._id);
  
      this.setData({
        merchantData: merchantData,
        serviceData: serviceData,
        participantNumber: participants.length,
      });
    },
    getMerchantServiceData(merchantID) {
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
    enterStore(e){
      this.setData({
        inStore: true
      })
    },
    exitStore(e){
      this.setData({
        inStore: false
      })
    },

    login(e) {
      wx.navigateTo({
        url: "../register/index",
      })
    },
    friendList(e){
        wx.navigateTo({
          url: "../friendList/index",
        })
    },

    error(e) {
        wx.navigateTo({
            url: "/pages/error/index",
        });
    },
    serviceNavigator(e) {
      wx.navigateTo({
        url:
          "/pages/serviceDetail/index?serviceid=" +
          e.currentTarget.dataset.serviceid,
      });
    },
    suggestion(e) {
        if (this.data.loginStatus == true) {
            wx.navigateTo({
                url: "/pages/suggestion/index",
            });
        } else {
            wx.showToast({
                title: "请先登录/注册",
            });
        }
    },
    developer(e) {
        wx.navigateTo({
            url: "/pages/developer/index",
        });
    },
    viewHistory(e) {
        wx.navigateTo({
            url: "/pages/orderList/index?cordid=" +
                this.data.userInfo._id +
                "&storeid=" +
                this.data.userInfo.store +
                "&order=true" +
                "&participation=true" +
                "&complete=true" +
                "&rejected=true"+ 
                "&merchantCategory=" + this.data.merchantData.category
        });
    },

    viewTransactions(e) {
        wx.navigateTo({
            url: "/pages/transactionList/index?openid=" +
                this.data.userInfo._id +
                "&storeid=" +
                this.data.userInfo.store +
                "&cordid=" +
                this.data.userInfo._id,
        });
    },

    viewOrders() {
        wx.navigateTo({
            url: "/pages/orderList/index?cordid=" +
                this.data.userInfo._id +
                "&storeid=" +
                this.data.userInfo.store +
                "&order=true" +
                "&pending=true" +
                "&paid=true"+ 
                "&merchantCategory=" + this.data.merchantData.category
        });
    },
    viewParticipation() {
        wx.navigateTo({
            url: "/pages/orderList/index?cordid=" +
                this.data.userInfo._id +
                "&storeid=" +
                this.data.userInfo.store +
                "&participation=true" +
                "&pending=true" +
                "&paid=true"
        });
    },

    orderNavigator(e) {
        wx.navigateTo({
            url: "/pages/orderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
        });
    },
    foodOrderNavigator(e) {
      wx.navigateTo({
          url: "/pages/foodOrderDetail/index?orderid=" + e.currentTarget.dataset.orderid,
      });
    },
    addService(){
      wx.navigateTo({
        url: "/pages/serviceForm/index?storeid=" + this.data.merchantData._id,
      });
    },
    editService(e){
      wx.navigateTo({
        url: "/pages/updateService/index?serviceid=" + e.currentTarget.dataset.service,
      });
    },
    editInfo(e){
      wx.navigateTo({
        url: "/pages/updateMerchant/index?storeid=" + this.data.merchantData._id,
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
            " " + [hour, minute].map(this.formatNumber).join(":")
        );
    },
    formatNumber(n) {
        n = n.toString();
        return n[1] ? n : "0" + n;
    },
});