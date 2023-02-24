// pages/merchantForm/index.js
Page({
  data: {
    detailFilelist:[],
  },
  onLoad(options){
    this.getServiceData(options.serviceid)
    this.setData({
      cordID: wx.getStorageSync('CordID'),
      serviceID: options.serviceid
    })
  },
  async getServiceData(serviceID){
    const res = await wx.cloud
      .database()
      .collection("service")
      .doc(serviceID)
      .get();

    let data = res.data
    
    let urlList = []

    data.picture.forEach(v=>{
      urlList.push({url:v})
    })

    this.setData({
      name: data.serviceName,
      CNYPrice: data.CNYPrice,
      USDPrice: data.USDPrice,
      merchant: data.merchant,
      detailFilelist: urlList,
      detailInfo: data.serviceDescription,
      subTitle: data.serviceSubtitle
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
    const { detailFilelist } = this.data;
    if(!this.data.name || !this.data.subTitle || !this.data.detailInfo || !this.data.USDPrice || !this.data.CNYPrice){
      wx.showToast({ title: '请填完所有必填信息(*号)', icon: 'none' });
      return
    }else if(!this.data.detailFilelist.length) {
      wx.showToast({ title: '请选择服务展示图', icon: 'none' });
      return
    }
    else {
      let finalDetailList = []
      try{
          for(let i = 0; i < detailFilelist.length; i++){
            let file = detailFilelist[i]
            const res = await this.uploadFilePromise(`${this.data.cordID}-service-pic-${this.data.serviceID}.png`, file, file.upload)
            finalDetailList.push(res)
          }
          this.submitForm(finalDetailList);
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
  
  async submitForm(fileList){
    const registerRes = await wx.cloud.callFunction({
      name: "updateService",
      data: {
        CNYPrice: this.data.CNYPrice,
        USDPrice: this.data.USDPrice,
        picture: fileList,
        serviceDescription: this.data.detailInfo,
        serviceName: this.data.name,
        serviceSubtitle: this.data.subTitle,
        serviceID: this.data.serviceID
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
          title: "服务更新成功",
          icon: "success",
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/user/index',
        })
      }, 1500);
  }
})