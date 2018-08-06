
//app.js
App({
  onLaunch: function (options) {
    console.log("APP options.",options);
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  
  globalData:{
    isDebug:true,
    hasUserInfo:false,
    userInfo:null
  }
})