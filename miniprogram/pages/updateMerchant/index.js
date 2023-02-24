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
    categoryTrans: {
      "study": "学习",
      "service": "服务",
      "entertainment": "娱乐"
    },
    coverFilelist:[],
    detailFilelist:[],
    cordID: wx.getStorageSync('CordID')
  },
  onLoad(options){
    this.setData({
      merchantID: options.storeid
    })
    this.getMerchantData(options.storeid)
  },
  async getMerchantData(merchantID) {
    const res = await wx.cloud
      .database()
      .collection("merchant")
      .doc(merchantID)
      .get();

    let data = res.data
    
    let urlList = []

    data.subPic.forEach(v=>{
      urlList.push({url:v})
    })

    this.setData({
      merchantData: data,
      name: data.title,
      detailInfo: data.billboard,
      locationName: data.locationName,
      locationDetail: data.locationDetail,
      longitude: data.longitude,
      latitude: data.latitude,
      availableTimes: data.availableTimes,
      paymentMethod: data.paymentInfo,
      lowestPrice: data.lowestPrice,
      category: data.category,
      chineseCategory: this.data.categoryTrans[data.category],
      coverFilelist: [{url:data.coverPic}],
      detailFilelist: urlList
    });
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
    coverFilelist.push({file, url:file.url, upload:true});
    this.setData({coverFilelist})
  },
  afterDeleteCover(event){
    const {coverFilelist} = this.data;
    const {file} = event.detail;
    coverFilelist.splice(file.index, 1);
    this.setData({coverFilelist})
  },
  afterReadDetail(event){
    const { file } = event.detail;
    const {detailFilelist = []} = this.data;
    detailFilelist.push({file, url:file.url, upload:true});
    this.setData({detailFilelist})
  },
  afterDeleteDetail(event){
    const {detailFilelist} = this.data;
    const {file} = event.detail;
    detailFilelist.splice(file.index, 1);
    this.setData({detailFilelist})
  },

  async uploadCoverToCloud() {
    wx.showLoading({
      title:"更新中"
    });
    const { coverFilelist } = this.data;
    const { detailFilelist } = this.data;
    if(!this.data.name || !this.data.category || !this.data.availableTimes || !this.data.paymentMethod || !this.data.lowestPrice){
      wx.showToast({ title: '请填完所有必填信息(*号)', icon: 'none' });
      return
    }
    else if (!this.data.coverFilelist.length) {
      wx.showToast({ title: '请选择封面图', icon: 'none' });
      return
    } else if(!this.data.detailFilelist.length) {
      wx.showToast({ title: '请选择店铺展示图', icon: 'none' });
      return
    }
    else {
      let finalCoverList = []
      let finalDetailList = []
      try{
          for(let i = 0; i < coverFilelist.length; i++){
            let file = coverFilelist[i]
            const res = await this.uploadFilePromise(`${this.data.cordID}-cover-pic-${i}.png`, file, file.upload)
            finalCoverList.push(res)
          }
          for(let i = 0; i < detailFilelist.length; i++){
            let file = detailFilelist[i]
            const res = await this.uploadFilePromise(`${this.data.cordID}-pic-${i}.png`, file, file.upload)
            finalDetailList.push(res)
          }
          this.submitForm(finalCoverList, finalDetailList);
        } catch (error) {
          console.log(error)
          wx.showToast({
            title: '照片上传错误',
            icon: 'error'
          })
        }
    }
  },
  uploadFilePromise(fileName, chooseResult, upload) {
    if(upload){
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: fileName,
          filePath: chooseResult.url
        }).then(async (res) => {
          console.log(res)
          resolve(await this.getHttpLink(res.fileID))
        })
        .catch((err) => {
            console.error(err)
            reject(err);
        });})
      }else{
      return chooseResult.url
    }
  },
  getHttpLink(fileID){
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: [fileID]
      }).then((res) => {
        resolve(res.fileList[0].tempFileURL);
      })
      .catch((err) => {
          console.error(err)
          reject(err);
      });})
  },
  async submitForm(cover, detail){
    const registerRes = await wx.cloud.callFunction({
      name: "updateMerchant",
      data: {
        availableTimes: this.data.availableTimes,
        detailInfo: this.data.detailInfo,
        category: this.data.category,
        coverpic: cover,
        cordid: this.data.cordID,
        locationDetail: this.data.locationDetail,
        locationName: this.data.locationName,
        lowestPrice: this.data.lowestPrice,
        paymentMethod: this.data.paymentMethod,
        longitude: this.data.longitude,
        latitude: this.data.latitude,
        detailpic: detail,
        name: this.data.name,
        merchantID: this.data.merchantData._id
      },
      });
      if (registerRes.errMsg != "cloud.callFunction:ok") {
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        })
        throw "registration failed";
      }
      wx.hideLoading({});
      wx.showToast({
          title: "更新成功",
          icon: "success",
      })
  }
})