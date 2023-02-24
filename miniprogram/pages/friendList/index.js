const app = getApp();
Page({
  data: {
    openid: wx.getStorageSync('openid'),
  },

  onLoad: function (options) {
    app.getUserInfo(this.data.openid);
    this.setData({
      userInfo: wx.getStorageSync('userInfo'),
      friendList: wx.getStorageSync('userInfo').friends
    })
    wx.stopPullDownRefresh();
  },
  onPullDownRefresh: function () {
    this.onLoad(); //重新加载onLoad()
    wx.hideLoading();
  },
  getUserData(userID) {
    return new Promise((resolve, reject) => {
        wx.cloud
            .database()
            .collection("user")
            .where({
                openid: userID,
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
chat(e){
  console.log(e);
  let chatID = e.currentTarget.dataset.chatid;
  let name = e.currentTarget.dataset.name;
  let targetOpenID = e.currentTarget.dataset.openid;
  wx.navigateTo({
    url: '/pages/example/chatroom_example/room/room?id=' + chatID + '&name=' + name+ '&haoyou_openid='+ targetOpenID,
  })
}
})