// pages/merchantForm/index.js
Page({
  data: {
    actions: [
      {
        name: "学习",
        className: "study",
      },
      {
        name: "服务",
        className: "service",
      },
      {
        name: "娱乐",
        className: "entertainment",
      },
    ],
    coverFilelist:[],
    detailFilelist:[],
    longitude: 0,
    latitude: 0
  },
  onLoad(e){
    this.setData({
      cordID: wx.getStorageSync('CordID')
    })
  },
  onChange(e){
    let content = e.detail
    switch(e.currentTarget.dataset.field){
      case "name":
        this.setData({
          name: content
        })
        break;
      case "detailInfo":
        this.setData({
          detailInfo: content
        })
        break;
      case "locationName":
        this.setData({
          locationName: content
        })
        break;
      case "locationDetail":
        this.setData({
          locationDetail: content
        })
        break;
      case "longitude":
        this.setData({
          longitude: content
        })
        break;
      case "latitude":
        this.setData({
          latitude: content
        })
        break;
      case "availableTimes":
        this.setData({
          availableTimes: content
        })
        break;
      case "paymentMethod":
        this.setData({
          paymentMethod: content
        })
        break;
        case "lowestPrice":
          this.setData({
            lowestPrice: content
          })
          break;
    }
  },
  onOpenSelector(e){
    this.setData({
      selectorShow: true,
    });
  },
  onClose() {
    this.setData({
      selectorShow: false,
    });
  },
  onSelect(event) {
    this.setData({
      category: event.detail.className,
      chineseCategory: event.detail.name
    })
    this.onClose();
  },
  afterReadCover(event){
    const { file } = event.detail;
    const {coverFilelist = []} = this.data;
    coverFilelist.push({file, url:file.url});
    this.setData({coverFilelist})
  },
  afterDeleteCover(event){
    const {coverFilelist} = this.data;
    coverFilelist.splice(event.detail.index, 1);
    this.setData({coverFilelist})
  },
  afterReadDetail(event){
    const { file } = event.detail;
    const {detailFilelist = []} = this.data;
    detailFilelist.push({file, url:file.url});
    this.setData({detailFilelist})
  },
  afterDeleteDetail(event){
    const {detailFilelist} = this.data;
    detailFilelist.splice(event.detail.index, 1);
    this.setData({detailFilelist})
  },
  uploadCoverToCloud() {
    const { coverFilelist } = this.data;
    const { detailFilelist } = this.data;
    coverFilelist.push.apply(coverFilelist, detailFilelist)
    if(!this.data.name || !this.data.category || !this.data.availableTimes || !this.data.paymentMethod || !this.data.lowestPrice){
      wx.showToast({ title: '请填完所有必填信息(*号)', icon: 'none' });
      return
    }
    if (!coverFilelist.length) {
      wx.showToast({ title: '请选择封面图', icon: 'none' });
    } else if(!detailFilelist.length) {
      wx.showToast({ title: '请选择店铺展示图', icon: 'none' });
    }
    else {
      wx.showLoading({
        title:"注册中"
      });
      const uploadTasks = coverFilelist.map((file, index) => this.uploadFilePromise(`${this.data.cordID}-pic-${index}.png`, file));
      Promise.all(uploadTasks)
        .then(data =>{
          const newFileList = data.map(item => (item.fileID));
          wx.cloud.getTempFileURL({
            fileList: newFileList
          }).then(res=>{
            let httpList = res.fileList.map(v=>(v.tempFileURL));
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
  async submitForm(fileList){
    console.log(fileList);
    const registerRes = await wx.cloud.callFunction({
      name: "registerMerchant",
      data: {
        availableTimes: this.data.availableTimes,
        detailInfo: this.data.detailInfo,
        category: this.data.category,
        coverpic: fileList.slice(0,1),
        cordid: this.data.cordID,
        locationDetail: this.data.locationDetail,
        locationName: this.data.locationName,
        lowestPrice: this.data.lowestPrice,
        paymentMethod: this.data.paymentMethod,
        longitude: this.data.longitude,
        latitude: this.data.latitude,
        detailpic: fileList.slice(1),
        name: this.data.name
      },
      });
      if (registerRes.errMsg != "cloud.callFunction:ok") {
        wx.showToast({
          title: '注册失败',
          icon: 'error'
        })
        throw "registration failed";
      }
      wx.hideLoading({});
      wx.showToast({
          title: "店家注册成功",
          icon: "success",
      });
      wx.setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        })
      }, 1500);
  }
})