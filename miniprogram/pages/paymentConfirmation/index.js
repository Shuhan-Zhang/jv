Page({
  data: {
    openid: wx.getStorageSync('openid'),
    userInfo: wx.getStorageSync('userInfo'),
    option: [
      { text: "微信支付", value: 0 },
      { text: "美元转账", value: 1 },
    ],
    value: 0,
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

  async payment(e) {
    if (this.data.selectedDateTime == "选择时间") {
      wx.showToast({
        title: "请先选择预约时间",
        icon: "none",
      });
      return;
    }
    //微信支付人民币
    if (this.data.value == 0) {
      try{
        wx.showLoading({title: '创建订单中'});
        let payTitle = this.data.serviceData.serviceName;
        let price = this.data.serviceData.CNYPrice;
        
        //init微信支付
        let wechatPayRes = await wx.cloud
        .callFunction({
            name: "payment",
            data: {
              title: payTitle,
              price: price,
              outTradeNo: this.makeid(30),
            }
        })
        if(wechatPayRes.result.resultCode != "SUCCESS"){
          console.log(wechatPayRes)
          throw "wechat pay failed"
        }

        //申请付款
        const payment = wechatPayRes.result.payment;
        let paymentRes = await wx.requestPayment({
          ...payment,
        })
        if(paymentRes.errMsg != "requestPayment:ok"){
          throw "request payment failed"
        }

        const transactionRes = await wx.cloud.callFunction({
          name: "createTransaction",
          data: {
            sender: this.data.userInfo._id,
            receiver: this.data.merchantID,
            amount: this.data.price,
            service: this.data.serviceData._id,
            category: "wechatCNY"
          },
        });
        if (!transactionRes.result._id) {
          throw "no transaction id";
        }
  
        const orderRes = await wx.cloud.callFunction({
          name: "createOrder",
          data: {
            merchant: this.data.merchantData._id,
            participant: this.data.userInfo._id,
            service: this.data.serviceData._id,
            transaction: transactionRes.result._id,
            date: new Date(new Date().getFullYear() + "/" + this.data.selectedDateTime),
            num: this.data.num,
            status: "paid",
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
        
      }catch(error){
        console.log(error)
        wx.showToast({
          title: '支付失败',
        })
      }
    }
    //美元转账
    else {
      wx.navigateTo({
        url:
          "/pages/transferConfirmation/index?serviceid=" +
          this.data.serviceData._id +
          "&amount=" +
          this.data.price +
          "&date=" +
          new Date().getFullYear() +
          "/" +
          this.data.selectedDateTime +
          "&num=" +
          this.data.num,
      });
    }
  },
  makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
      charactersLength));
    } 
    return result;
  },
});
