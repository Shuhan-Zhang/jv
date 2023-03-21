Page({
  data: {
    openid: wx.getStorageSync("openid"),
    cordid: wx.getStorageSync("CordID"),
    userInfo: wx.getStorageSync('userInfo'),
    num: 1,
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
    file: "",
  },

  onLoad: function (options) {
    Date.prototype.addMinutes = function (h) {
      return new Date(this.getTime() + h * 60 * 1000);
    };
    this.setData({
      serviceID: options.serviceid,
      merchantID: options.merchantid,
    });
    this.getServiceData(options.serviceid);
  },

  formatDate(date) {
    date = new Date(date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
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
      total: res.data.USDPrice,
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

  onNumberChange(e){
    this.setData({
      num: e.detail,
      total: e.detail * this.data.serviceData.USDPrice
    })
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

    if (startTime != 0 || endTime != 0) {
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

  onConfirmDateTime(e) {
    console.log(e);
    let selectedDate = this.data.selectedDate;
    let selectedTime = this.data.selectedTime;
    let selectedDataTime = new Date(
      new Date().getFullYear() + "/" + selectedDate + " " + selectedTime
    );
    var ifFull = false;
    // if (selectedDataTime in this.data.previousAppointmentList) {

    // }
    this.data.previousAppointmentList.forEach((v) => {
      if (selectedDataTime.getTime() == v.getTime()) {
        ifFull = true;
      }
    });

    if (!ifFull) {
      this.selectComponent("#item").toggle();
      this.setData({
        selectedDateTime: selectedDate + " " + selectedTime,
      });
    } else {
      wx.showToast({
        title: "改时间已满，请重选",
        icon: "none",
      });
    }
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
    if (this.data.selectedDateTime == "选择时间") {
      wx.showToast({
        title: "请先选择预约时间",
        icon: "none",
      });
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
              category: "reservation",
              sender: this.data.cordid,
              receiver: this.data.merchantData.leader,
              amount: this.data.total,
              service: this.data.serviceData._id,
              screenshot: res.fileID,
          },
      });
      if (!transactionRes.result._id) {
        throw "transaction creation failed";
      }

      const orderRes = await wx.cloud.callFunction({
          name: "createOrder",
          data: {
              category: "reservation",
              merchant: this.data.merchantData._id,
              participant: this.data.cordid,
              transaction: transactionRes.result._id,
              service: this.data.serviceData._id,
              date: new Date(new Date().getFullYear() + "/" + this.data.selectedDateTime),
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
