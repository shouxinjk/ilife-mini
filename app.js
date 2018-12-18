
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

//以下为底部菜单，当前仅发布商品浏览功能
/**
"tabBar": {
    "color": "#000",
    "borderStyle": "white",
    "backgroundColor": "#fff",
    "selectedColor": "#fc3151",
    "list": [
      {
        "pagePath": "pages/home/home",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-selected.png",
        "text": "大生活"
      },
      {
        "pagePath": "pages/feeds/feeds",
        "iconPath": "images/cart.png",
        "selectedIconPath": "images/cart-selected.png",
        "text": "小确幸"
      },
      {
        "pagePath": "pages/circle/circle",
        "iconPath": "images/category.png",
        "selectedIconPath": "images/category-selected.png",
        "text": "TA们"
      },
      {
        "pagePath": "pages/user/user",
        "iconPath": "images/user.png",
        "selectedIconPath": "images/user-selected.png",
        "text": "我"
      }
    ]
  }
 */