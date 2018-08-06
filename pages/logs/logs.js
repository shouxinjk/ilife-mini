//logs.js
var util = require('../../utils/util.js')
Page({
  data: {
    logs: []
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(function (log) {
        return util.formatTime(new Date(log))
      })
    })
  },
  //登录获取code
  login: function () {
    wx.login({
      success: function (res) {
        console.log(res.code)
        //发送请求
        wx.request({
          url: 'https://data.shouxinjk.net/util/wxLogin.php', //接口地址
          data: { code: res.code },
          header: {
            'content-type': 'application/json' //默认值
          },
          success: function (res) {
            console.log(res.data)
          }
        })
      }
    })
  }
})
