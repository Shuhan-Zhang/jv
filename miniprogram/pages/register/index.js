const defaultAvatarUrl = "cloud://cord-4gtkoygbac76dbeb.636f-cord-4gtkoygbac76dbeb-1312381645/preLoginWhite.png";
Page({
    data: {
        avatarUrl: defaultAvatarUrl,
        userName: "",
        openid: wx.getStorageSync("openid"),
    },
    onLoad: function(options) {},
    nameChanged(e) {
        console.log(e);
        this.setData({ userName: e.detail.value });
    },
    onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        this.setData({
            avatarUrl,
        });
    },
    async register(e) {
        if (this.data.userName == "") {
            wx.showToast({
                title: "昵称不能为空",
                icon: "none",
            });
            return;
        }else if (this.data.avatarUrl == defaultAvatarUrl){
          wx.showToast({
            title: "请选择头像",
            icon: "none",
        });
          return;
        }
        try {
            const confirmRes = await wx.showModal({
                title: "确定注册?",
                placeholderText: "请确认注册信息",
                cancelColor: "cancelColor",
            });
            if (confirmRes.cancel == true) {
                throw "no permission";
            }
            wx.showLoading({
                title: "注册中",
            });

            var screenshotID = this.data.openid + "profilePic.jpg";
            let httpPath = ""

            const picRes = await wx.cloud.uploadFile({
                cloudPath: screenshotID,
                filePath: this.data.avatarUrl,
            });
            if (picRes.errMsg != "cloud.uploadFile:ok") {
              throw "pic upload failed";
            }else{
              httpPath = await wx.cloud.getTempFileURL({
                fileList: [picRes.fileID]
            })
          }
            const registerRes = await wx.cloud.callFunction({
                name: "registerUser",
                data: {
                    profilePic: httpPath.fileList[0].tempFileURL,
                    username: this.data.userName,
                    openid: this.data.openid,
                },
            });
            if (registerRes.errMsg != "cloud.callFunction:ok") {
              throw "registration failed";
            }
            wx.hideLoading({});
            wx.showToast({
                title: "注册成功",
                icon: "success",
            });
            wx.navigateBack({
                delta: 0,
            });
        } catch (err) {
          console.log(err);
            wx.showToast({
                title: "注册失败",
                icon: "error",
                duration: 1500,
            });
        }
    },
});