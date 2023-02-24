// pages/merchantForm/index.js
Page({
    data: {
        detailFilelist: [],
    },
    onLoad(options) {
        this.setData({
            cordID: wx.getStorageSync('CordID'),
            storeID: options.storeid
        })
    },
    onChange(e) {
        let content = e.detail
        switch (e.currentTarget.dataset.field) {
            case "name":
                this.setData({
                    name: content
                })
                break;
            case "subTitle":
                this.setData({
                    subTitle: content
                })
                break;
            case "detailInfo":
                this.setData({
                    detailInfo: content
                })
                break;
            case "USDPrice":
                this.setData({
                    USDPrice: content
                })
                break;
            case "CNYPrice":
                this.setData({
                    CNYPrice: content
                })
                break;
        }
    },
    afterReadDetail(event) {
        const { file } = event.detail;
        const { detailFilelist = [] } = this.data;
        detailFilelist.push({ file, url: file.url });
        this.setData({ detailFilelist })
    },
    afterDeleteDetail(event) {
        const { detailFilelist } = this.data;
        detailFilelist.splice(event.detail.index, 1);
        this.setData({ detailFilelist })
    },
    uploadCoverToCloud() {
        const { detailFilelist } = this.data;
        wx.showLoading({
            title: "申请中"
        });
        if (!this.data.name || !this.data.subTitle || !this.data.detailInfo || !this.data.USDPrice || !this.data.CNYPrice) {
            wx.showToast({ title: '请填完所有必填信息(*号)', icon: 'none' });
            return
        } else if (!detailFilelist.length) {
            wx.showToast({ title: '请选择服务展示图', icon: 'none' });
        } else {
            const uploadTasks = detailFilelist.map((file, index) => this.uploadFilePromise(`${this.data.cordID}-service-pic-${index}.png`, file));
            Promise.all(uploadTasks)
                .then(data => {
                    const newFileList = data.map(item => (item.fileID));
                    wx.cloud.getTempFileURL({
                        fileList: newFileList
                    }).then(res => {
                        let httpList = res.fileList.map(v => (v.tempFileURL));
                        this.submitForm(httpList);
                    })
                })
                .catch(e => {
                    wx.showToast({ title: '图片上传失败', icon: 'none' });
                    console.log(e);
                });
        }
    },

    uploadFilePromise(fileName, chooseResult) {
        return wx.cloud.uploadFile({
            cloudPath: fileName,
            filePath: chooseResult.url
        });
    },
    async submitForm(fileList) {
        const registerRes = await wx.cloud.callFunction({
            name: "registerService",
            data: {
                CNYPrice: this.data.CNYPrice,
                USDPrice: this.data.USDPrice,
                merchant: this.data.storeID,
                picture: fileList,
                serviceDescription: this.data.detailInfo,
                serviceName: this.data.name,
                serviceSubtitle: this.data.subTitle,
            },
        });
        if (registerRes.errMsg != "cloud.callFunction:ok") {
            wx.showToast({
                title: '申请失败',
                icon: 'error'
            })
            throw "registration failed";
        }
        wx.hideLoading({});
        wx.showToast({
            title: "服务申请成功",
            icon: "success",
        });
        setTimeout(() => {
            wx.switchTab({
                url: '/pages/user/index',
            })
        }, 1500);
    }
})