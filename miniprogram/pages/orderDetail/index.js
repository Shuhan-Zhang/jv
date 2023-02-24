Page({
  data: {
    ifMerchant: false,
    cordID: wx.getStorageSync("CordID"),
    show: false,
    statusLoading: false,
    dateStatusLoading: false,
    selectorShow: false,
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
    selectedDate: "",
    selectedDateObject: "",
    calendarShow: false,
    timeShow: false,
    minHour: 10,
    maxHour: 20,
    minDate: new Date().getTime(),
    maxDate: new Date(2024, 10, 1).getTime(),
    selectedTime: "12:00",
    shownTime: "",
    ifTime: false,
    selectedDateTime: "选择时间",
    filter(type, options) {
      if (type === "minute") {
        return options.filter((option) => option % 30 === 0);
      }

      return options;
    },
  },

  onLoad: function (options) {
    Date.prototype.addMinutes = function (h) {
      return new Date(this.getTime() + h * 60 * 1000);
    };
    wx.showLoading({
      title: "加载中",
    });
    this.getOrderData(options.orderid);
    this.setData({
      orderID: options.orderid,
    });
    wx.stopPullDownRefresh();
  },
  onReady: function (options) {
    wx.hideLoading();
  },
  onPullDownRefresh: function () {
    this.onLoad(this.data.options); //重新加载onLoad()
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
    orderData.data.reservationTime = this.formatTimeWithHours(
      new Date(orderData.data.date)
    );
    this.setData({
      orderData: orderData.data,
    });
    await this.getServiceData(orderData.data.service);
    await this.getMerchantData(orderData.data.merchant);
    await this.getPreviousAppointmentTime(orderData.data.merchant);
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

  //Time code
  formatDate(date) {
    date = new Date(date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  onOpenSelector(e) {
    this.setData({
      selectorShow: true,
    });
  },
  onSelectorClose() {
    this.setData({
      selectorShow: false,
    });
  },

  async getPreviousAppointmentTime(merchantID) {
    let db = wx.cloud.database();
    const _ = db.command;
    const res = await wx.cloud
      .database()
      .collection("orders")
      .where({
        merchant: merchantID,
        date: _.gt(new Date()),
      })
      .get();

    var previousAppointmentList = [];
    res.data.forEach((v) => {
      let date = new Date(v.date);
      previousAppointmentList.push(date);
      previousAppointmentList.push(date.addMinutes(30));
    });

    this.setData({
      previousAppointmentList: previousAppointmentList,
    });
  },

  //Calendar Code
  onOpenCalendar() {
    this.setData({ calendarShow: true });
  },
  onCloseCalendar() {
    this.setData({ calendarShow: false });
  },
  onConfirmDate(e) {
    let merchantAvailableTimes = this.data.merchantData.availableTimesJson;
    let selectedDateObject = new Date(e.detail);
    let selectedWeekday = selectedDateObject.getDay();
    var startTime = 0;
    var endTime = 0;
    var ifTime = false;
    merchantAvailableTimes.forEach((v) => {
      if (v.day == selectedWeekday) {
        (startTime = v.startTime), (endTime = v.endTime);
      }
    });

    if (startTime != 0 && endTime != 0) {
      ifTime = true;
    }

    this.setData({
      calendarShow: false,
      selectedDate: this.formatDate(e.detail),
      minHour: startTime,
      maxHour: endTime,
      selectedDateObject: new Date(e.detail),
      ifTime: ifTime,
    });
  },

  //Time Picker Code

  onOpenTimePicker(e) {
    if (this.data.selectedDate == "") {
      wx.showToast({
        title: "请先选择日期",
        icon: "none",
      });
    } else if (this.data.ifTime == false) {
      wx.showToast({
        title: "该日无档期，请重选日期",
        icon: "none",
      });
    } else {
      this.setData({
        timeShow: true,
      });
    }
  },

  onConfirmTime(e) {
    this.setData({
      selectedTime: e.detail,
    });
  },

  onTimeClose(e) {
    this.setData({
      timeShow: false,
      shownTime: e.detail,
    });
  },

  async onConfirmDateTime(e) {
    let that = this
    let selectedDate = this.data.selectedDate;
    let selectedTime = this.data.selectedTime;
    let selectedDataTime = new Date(
      new Date().getFullYear() + "/" + selectedDate + " " + selectedTime
    );
    var ifFull = false;

    this.data.previousAppointmentList.forEach((v) => {
      if (selectedDataTime.getTime() == v.getTime()) {
        ifFull = true;
      }
    });

    if (!ifFull) {
      this.setData({
        selectorShow : false,
        dateStatusLoading: true
      })
      wx.showModal({
        title: "确定更改时间?",
        placeholderText: new Date().getFullYear() + "/" + selectedDate + " " + selectedTime,
        cancelColor: 'cancelColor',
      }).then(res=>{
        if(this.updateReservationTime(selectedDataTime, this.data.orderID)){
          wx.showToast({
            title: '时间更新成功',
            icon: 'success'
          })
          setTimeout(function () {
            that.getOrderData(that.data.orderID);
            that.setData({
              dateStatusLoading: false,
            });
          }, 1500)

        }else{
          wx.showToast({
            title: '时间更新失败',
            icon: 'error'
          })
        }
      }).catch(err=>{
        wx.showToast({
          title: '已取消',
          icon: "none"
        })
      })
    } else {
      wx.showToast({
        title: "该时间已满，请重选",
        icon: "none",
      });
    }
  },
  async updateReservationTime(date, orderid){
    await wx.cloud
    .callFunction({
      name: "updateReservationTime",
      data: {
        orderid: orderid,
        date: date
      },
    }).then(res=>{
      return true;
    }).catch(err=>{
      return false;
    })
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
    let that = this;
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
    this.onClose();
    setTimeout(function () {
      that.getOrderData(that.data.orderID);
      that.setData({
        statusLoading: false,
      });
    }, 1500)
  },
});
