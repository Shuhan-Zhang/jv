//app.js
App({
  globalData: {
    userInfo: null,
    friends: []
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cord-4gtkoygbac76dbeb',
        traceUser: true,
      })
    }

    this.autoUpdate();    
    this.getOpenid();
    this.getLoginStatus();
  },


  autoUpdate: function() {
    var self = this
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      //1. 检查小程序是否有新版本发布
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          //检测到新版本，需要更新，给出提示
          wx.showModal({
            title: '更新提示',
            content: '检测到新版本，是否下载新版本并重启小程序？',
            success: function(res) {
              if (res.confirm) {
                //2. 用户确定下载更新小程序，小程序下载及更新静默进行
                self.downLoadAndUpdate(updateManager)
              } else if (res.cancel) {
                //用户点击取消按钮的处理，如果需要强制更新，则给出二次弹窗，如果不需要，则这里的代码都可以删掉了
                wx.showModal({
                  title: '提示',
                  content: '本次版本更新涉及到新的功能添加，旧版本无法正常访问的',
                  showCancel:false,//隐藏取消按钮
                  confirmText:"确定更新",//只保留确定更新按钮
                  success: function(res) {
                    if (res.confirm) {
                      //下载新版本，并重新应用
                      self.downLoadAndUpdate(updateManager)
                    }
                  }
                })
              }
            }
          })
        }
      })
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试'
      })
    }
  },
  downLoadAndUpdate: function (updateManager){
    var self=this
    wx.showLoading();
    //静默下载更新小程序新版本
    updateManager.onUpdateReady(function () {
      wx.hideLoading()
      //新的版本已经下载好，调用 applyUpdate 应用新版本并重启
      updateManager.applyUpdate()
    })
    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
      wx.showModal({
        title: '新版本存在',
        content: '新版本已经上线，请您删除当前小程序，重新搜索打开',
      })
    })
  },

    // 获取用户openid
    getOpenid: function () {
      var app = this;
      var openidStor = wx.getStorageSync('openid');
      if (openidStor) {
        app.globalData.openid = openidStor;
        wx.setStorageSync('openid', openidStor);
        app._getMyUserInfo();
      } else {
        wx.cloud.callFunction({
          name: 'getOpenid',
          success(res) {
            var openid = res.result.openid;
            wx.setStorageSync('openid', openid)
            app.getUserInfo(openid);
            app.globalData.openid = openid;
            app._getMyUserInfo();
          },
          fail(res) {
            console.log('云函数获取失败', res)
          }
        })
      }
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
              wx.setStorageSync("loginStatus", status);
              wx.setStorageSync("userInfo", res.data[0]);
              //更新CORD ID
              wx.setStorageSync("CordID", res.data[0]._id);
          })
          .catch((err) => {
              console.log("error loading user", err);
          });
  },
    //获取自己后台的user信息
    _getMyUserInfo() {
      let app = this
      var userStor = wx.getStorageSync('user');
      if (userStor) {
        app.globalData.userInfo = userStor;
      }
    },
    _checkOpenid() {
      let app = this
      let openid = this.globalData.openid;
      if (!openid) {
        app.getOpenid();
        wx.showLoading({
          title: 'openid不能为空，请重新登录',
        })
        return null;
      } else {
        return openid;
      }
    },
    // 保存userinfo
    _saveUserInfo: function (user) {
      this.globalData.userInfo = user;
      wx.setStorageSync('user', user);
    },
    showErrorToastUtils: function (e) {
      wx.showModal({
        title: '提示',
        confirmText: '确认',
        showCancel: false,
        content: e,
        success: function (res) {
          if (res.confirm) {
          }
        }
      })
    },
    getLoginStatus() {
      var userInfo = wx.getStorageSync('userInfo');
      var status = userInfo.length != 0;
      wx.setStorageSync('loginStatus', status);
    },
})
