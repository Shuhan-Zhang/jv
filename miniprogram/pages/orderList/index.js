Page({
  data: {
    loading: true,
    option1: [
      { text: "所有记录", value: "ab" },
      { text: "我的订单", value: "a" },
      { text: "我的参与", value: "b" },
    ],
    option2: [
      { text: "所有状态", value: "abcd" },
      { text: "现存", value: "ab" },
      { text: "历史", value: "cd" },
      { text: "待审核", value: "a" },
      { text: "已付款", value: "b" },
      { text: "已完成", value: "c" },
      { text: "已拒绝", value: "d" },
    ],
    value1: "ab",
    value2: "abcd",
  },
  onLoad: function (options) {
    var filter1 = "";
    var filter2 = "";

    if (options.order) {
      filter1 += "a";
    }
    if (options.participation) {
      filter1 += "b";
    }

    if (options.pending) {
      filter2 += "a";
    }
    if (options.paid) {
      filter2 += "b";
    }
    if (options.complete) {
      filter2 += "c";
    }
    if (options.rejected) {
      filter2 += "d";
    }

    this.getAllData(options.storeid, options.cordid, filter1, filter2);

    this.setData({
      value1: filter1,
      value2: filter2,
      cordID: options.cordid,
      storeid: options.storeid,
      options: options,
    });
    wx.stopPullDownRefresh();
  },
  onReady: function () {
    this.setData({
      loading: false,
    });
  },
  onPullDownRefresh: function () {
    this.onLoad(this.data.options); //重新加载onLoad()
    wx.hideLoading();
  },

  categoryChanged(value) {
    this.changeFilter(
      value.detail,
      this.data.value2,
      this.data.orders,
      this.data.participations
    );
    this.setData({
      value1: value.detail,
    });
  },
  statusChanged(value) {
    this.changeFilter(
      this.data.value1,
      value.detail,
      this.data.orders,
      this.data.participations
    );
    this.setData({
      value2: value.detail,
    });
  },

  changeFilter(filter1, filter2, allOrderData, allParticipationData) {
    var ifOrder = false;
    var ifParticipation = false;
    var ifPending = false;
    var ifPaid = false;
    var ifComplete = false;
    var ifRejected = false;

    if (filter1.includes("a")) {
      ifOrder = true;
    }
    if (filter1.includes("b")) {
      ifParticipation = true;
    }
    if (filter2.includes("a")) {
      ifPending = true;
    }
    if (filter2.includes("b")) {
      ifPaid = "true";
    }
    if (filter2.includes("c")) {
      ifComplete = true;
    }
    if (filter2.includes("d")) {
      ifRejected = true;
    }
    var finalOrders = [];
    var finalParticipations = [];
    if (ifOrder) {
      if (ifPending) {
        allOrderData.forEach((v) => {
          if (v.status == "pending") {
            finalOrders.push(v);
          }
        });
      }
      if (ifPaid) {
        allOrderData.forEach((v) => {
          if (v.status == "paid") {
            finalOrders.push(v);
          }
        });
      }
      if (ifComplete) {
        allOrderData.forEach((v) => {
          if (v.status == "complete") {
            finalOrders.push(v);
          }
        });
      }
      if (ifRejected) {
        allOrderData.forEach((v) => {
          if (v.status == "rejected") {
            finalOrders.push(v);
          }
        });
      }
    }

    if (ifParticipation) {
      if (ifPending) {
        allParticipationData.forEach((v) => {
          if (v.status == "pending") {
            finalParticipations.push(v);
          }
        });
      }
      if (ifPaid) {
        allParticipationData.forEach((v) => {
          if (v.status == "paid") {
            finalParticipations.push(v);
          }
        });
      }
      if (ifComplete) {
        allParticipationData.forEach((v) => {
          if (v.status == "complete") {
            finalParticipations.push(v);
          }
        });
      }
      if (ifRejected) {
        allParticipationData.forEach((v) => {
          if (v.status == "rejected") {
            finalParticipations.push(v);
          }
        });
      }
    }
    
    finalOrders.sort(function(a,b) {
      return a.date.getTime() - b.date.getTime()
   });
   finalParticipations.sort(function(a,b) {
      return a.date.getTime() - b.date.getTime()
   });
   console.log(finalOrders)
    this.setData({
      selectedOrders: finalOrders,
      selectedParticipations: finalParticipations,
    });
  },

  async getAllData(storeID, cordID, filter1, filter2) {
    var ifOrder = false;
    var ifParticipation = false;
    var ifPending = false;
    var ifPaid = false;
    var ifComplete = false;
    var ifRejected = false;

    if (filter1.includes("a")) {
      ifOrder = true;
    }
    if (filter1.includes("b")) {
      ifParticipation = true;
    }
    if (filter2.includes("a")) {
      ifPending = true;
    }
    if (filter2.includes("b")) {
      ifPaid = true;
    }
    if (filter2.includes("c")) {
      ifComplete = true;
    }
    if (filter2.includes("d")) {
      ifRejected = true;
    }
    this.getUserOrders(
      storeID,
      ifOrder,
      ifPending,
      ifPaid,
      ifComplete,
      ifRejected
    );
    this.getUserParticipations(
      cordID,
      ifParticipation,
      ifPending,
      ifPaid,
      ifComplete,
      ifRejected
    );
  },

  async getUserOrders(
    storeID,
    ifOrder,
    ifPending,
    ifPaid,
    ifComplete,
    ifRejected
  ) {
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        merchant: storeID,
      })
      .orderBy("date", "asc")
      .get();

    var allOrderData = [];
    var selectedOrders = [];
    res.data.forEach(async (v) => {
      const serviceData = await this.getServiceData(v.service);
      const participantData = await this.getUserData(v.participant);
      const merchantData = await this.getMerchantData(v.merchant);
      const transactionData = await this.getTransactionData(v.transaction);
      const createTime = this.formatTimeWithHours(new Date(v.createTime));
      const reservationTime = new Date(v.date);
      v.serviceData = serviceData;
      v.reservationTime = this.formatTimeWithHours(reservationTime);
      v.createTime = createTime;
      v.transactionData = transactionData;
      v.participantData = participantData;
      v.merchantData = merchantData;

      if (ifOrder) {
        if (reservationTime < new Date()) {
          v.status = "complete";
        }

        if (ifPending) {
          if (v.status == "pending") {
            selectedOrders.push(v);
          }
        }
        if (ifPaid) {
          if (v.status == "paid") {
            selectedOrders.push(v);
          }
        }
        if (ifComplete) {
          if (v.status == "complete") {
            selectedOrders.push(v);
          }
        }
        if (ifRejected) {
          if (v.status == "rejected") {
            selectedOrders.push(v);
          }
        }
      }

      allOrderData.push(v);
      allOrderData.sort(function(a,b) {
        return a.date.getTime() - b.date.getTime()
     });
     selectedOrders.sort(function(a,b) {
      return a.date.getTime() - b.date.getTime()
     });
      this.setData({
        selectedOrders: selectedOrders,
        orders: allOrderData,
      });
    });
  },

  async getUserParticipations(
    cordid,
    ifParticipation,
    ifPending,
    ifPaid,
    ifComplete,
    ifRejected
  ) {
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        participant: cordid,
      })
      .orderBy("date", "asc")
      .get();

    var allParticipations = [];
    var selectedParticipations = [];
    res.data.forEach(async (v) => {
      const serviceData = await this.getServiceData(v.service);
      const participantData = await this.getUserData(v.participant);
      const merchantData = await this.getMerchantData(v.merchant);
      const transactionData = await this.getTransactionData(v.transaction);
      const reservationTime = new Date(v.date);
      v.serviceData = serviceData;
      v.reservationTime = this.formatTimeWithHours(reservationTime);
      v.participantData = participantData;
      v.merchantData = merchantData;
      v.transactionData = transactionData;

      if (ifParticipation) {
        if (reservationTime < new Date()) {
          v.status = "complete";
        }

        if (ifPending) {
          if (v.status == "pending") {
            selectedParticipations.push(v);
          }
        }
        if (ifPaid) {
          if (v.status == "paid") {
            selectedParticipations.push(v);
          }
        }
        if (ifComplete) {
          if (v.status == "complete") {
            selectedParticipations.push(v);
          }
        }
        if (ifRejected) {
          if (v.status == "rejected") {
            selectedParticipations.push(v);
          }
        }
      }

      allParticipations.push(v);
      allParticipations.sort(function(a,b) {
        return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
     });
     selectedParticipations.sort(function(a,b) {
      return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime()
     });
      this.setData({
        selectedParticipations: selectedParticipations,
        participations: allParticipations,
      });
    });
  },

  // async getUserOrders(storeID, ifPending, ifPaid, ifComplete) {
  //   const _ = wx.cloud.database().command;
  //   var filter = [];
  //   if (ifPending) {
  //     filter.push("pending");
  //   }
  //   if (ifPaid) {
  //     filter.push("paid");
  //   }
  //   if (ifComplete) {
  //     filter.push("complete");
  //   }
  //   const res = await wx.cloud
  //     .database()
  //     .collection("orders")
  //     .where({
  //       merchant: storeID,
  //       status: _.or(filter),
  //     })
  //     .orderBy("_createTime", "desc")
  //     .limit(3)
  //     .get();

  //   var allOrderData = [];
  //   res.data.forEach(async (v) => {
  //     const serviceData = await this.getServiceData(v.service);
  //     const participantData = await this.getUserData(v.participant);
  //     const merchantData = await this.getMerchantData(v.merchant);
  //     const transactionData = await this.getTransactionData(v.transaction);
  //     const createTime = this.formatTimeWithHours(new Date(v.createTime));
  //     v.serviceData = serviceData;
  //     v.createTime = createTime;
  //     v.transactionData = transactionData;
  //     v.participantData = participantData;
  //     v.merchantData = merchantData;
  //     allOrderData.push(v);
  //     this.setData({
  //       orders: allOrderData,
  //     });
  //   });
  // },

  // async getUserParticipations(cordid, ifPending, ifPaid, ifComplete) {
  //   const _ = wx.cloud.database().command;
  //   var filter = [];
  //   if (ifPending) {
  //     filter.push("pending");
  //   }
  //   if (ifPaid) {
  //     filter.push("paid");
  //   }
  //   if (ifComplete) {
  //     filter.push("complete");
  //   }
  //   const res = await wx.cloud
  //     .database()
  //     .collection("orders")
  //     .where({
  //       participant: cordid,
  //     })
  //     .orderBy("_createTime", "desc")
  //     .limit(3)
  //     .get();

  //   var alParticipations = [];
  //   res.data.forEach(async (v) => {
  //     const serviceData = await this.getServiceData(v.service);
  //     const participantData = await this.getUserData(v.participant);
  //     const merchantData = await this.getMerchantData(v.merchant);
  //     const transactionData = await this.getTransactionData(v.transaction);
  //     v.serviceData = serviceData;
  //     v.participantData = participantData;
  //     v.merchantData = merchantData;
  //     v.transactionData = transactionData;
  //     alParticipations.push(v);
  //     this.setData({
  //       participations: alParticipations,
  //     });
  //   });
  // },

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
