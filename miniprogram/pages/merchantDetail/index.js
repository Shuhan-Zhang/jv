const app = getApp();
Page({
  data: {
    loading: true,
    openid: wx.getStorageSync('openid'),
  },

  onLoad: function (options) {
    wx.showLoading({
      title: "加载商家中",
    });
    this.getMerchantData(options.id);
    app.getUserInfo(wx.getStorageSync('openid'));
    this.setData({
      loginStatus: wx.getStorageSync('loginStatus'),
      userInfo: wx.getStorageSync('userInfo'),
      options: options
    })
    setTimeout(() => {
      wx.hideLoading()
      this.setData({
        loading: false
      })
    }, 1000)
  },
  onPullDownRefresh: function () {
    this.onLoad(this.data.options);
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
    let rating = 0;
    let totalRated = 0;

    participants.forEach(v=>{
      if(v.rating){
        rating += v.rating;
        totalRated += 1;
      }
    })


    merchantData.leaderData = leaderData;

    this.setData({
      merchantData: merchantData,
      serviceData: serviceData,
      rating: (rating / totalRated).toFixed(1),
      totalRated: totalRated
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

  openLocation(e){
    let long = this.data.merchantData.longitude
    let lat = this.data.merchantData.latitude
    let locationName = this.data.merchantData.locationName
    let locationDetail = this.data.merchantData.locationDetail
    if(!this.data.merchantData.longitude || !this.data.merchantData.latitude){
      wx.showToast({
        title: '商家未提供具体地址',
        icon: 'none'
      })
      return
    }else{
      wx.openLocation({//​使用微信内置地图查看位置。
        latitude: lat,//要去的纬度-地址
        longitude: long,//要去的经度-地址
        name: locationName,
        address: locationDetail
      })
    }
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
        e.currentTarget.dataset.serviceid +
        "&data=" + JSON.stringify(e.currentTarget.dataset.data)
    });
  },
  navigateBack(e){
    wx.navigateBack({
      delta: 1
    })
  },
  async contactMerchant(e){
    if(this.data.userInfo && this.data.loginStatus == true){
      var userInfo = this.data.userInfo;
      var merchantInfo = this.data.merchantData.leaderData;
      var merchantOpenID = this.data.merchantData.leaderData.openid;
      var openID = this.data.openid;
      var chatID = merchantOpenID + this.data.openid;
      
      try{
        if(!userInfo.friends.some(e => e.openid == merchantOpenID)) {
          let subscribeRes = await wx.requestSubscribeMessage({
            tmplIds: ["b0cVrk0vEvthUKTmqt7xV-31wgxUcC-beFDI5N4kkXc"]});
          if (subscribeRes.errMsg != "requestSubscribeMessage:ok") {
            throw "request subscribe message failed";
          }
          let addPeopleRes = await wx.cloud.callFunction({
            name: "yunrouter",
            data: {
              $url: "confirmpeopleadd", //云函数路由参数
              askpeopleid: openID,
              askpeopleinfo: userInfo,
              addpeopleid: merchantOpenID,
              addpeopleinfo: merchantInfo,
              chatid: chatID
            }
          });
          if (addPeopleRes.errMsg != "cloud.callFunction:ok") {
            throw "add people failed";
          }
        }
        wx.navigateTo({
          url: '/pages/example/chatroom_example/room/room?id=' + chatID + '&name=' + merchantInfo.username+ '&haoyou_openid='+ merchantOpenID,
        })
      }catch(error){
        wx.showToast({
          title: '私信失败',
          icon: 'error'
        })
      }
    }else{
      wx.showToast({
        title: '请先登陆/注册',
        icon: 'none'
      })
    }
  },
});
