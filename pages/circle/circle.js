const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    userInfo: {},
    connections: [],
    colorful: [],//通过计算设置每一个标签是否采用高亮颜色
    colors: [],//设置一个颜色列表
  },

  loadConnections: function () {
    var that = this
    //TODO: 需要根据当前用户加载关联用户列表
    util.AJAX("user/users", function (res) {
      var arr = res.data;
      //console.log(arr);
      var plist = that.data.connections;
      that.setData({
        connections:plist.concat(arr)
      });
    });
  },

  loadTagColors: function () {
    var that = this;
    var rgbs = [];
    for (var i = 0; i < 200; i++) {//默认构建一个200种颜色的数组
      var r = Math.floor(Math.random() * 256); //随机生成256以内r值
      var g = Math.floor(Math.random() * 256); //随机生成256以内g值
      var b = Math.floor(Math.random() * 256); //随机生成256以内b值
      rgbs = rgbs.concat(`rgb(${r},${g},${b})`); //返回rgb(r,g,b)格式颜色
    }
    //console.log(rgbs);
    that.setData({
      colors: rgbs
    });
  },
  //点击触发
  onShow() {

  },

  onLoad() {
    var that=this;
    this.loadConnections();
    this.setData({
      userInfo: app.globalData.userInfo,
    });
    /**
    * 获取系统信息。由于滚动下拉需要窗口高度，必须预先获取并设置
    */
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
  },

  jump:function(e) {
    console.log("navigate to",e);
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: "/pages/user/profile/user?id="+url
    });
  },

  //点击TabBar后消除红点
  onTabItemTap(item) {
    console.log("onTabItemTap", item);
    wx.hideTabBarRedDot(item);
  },

  scrolltolower: function (e) {
    console.log("load more connections...");
    var that = this;
    // 加载更多 loading
    that.setData({
      hothidden: true
    })
    // 如果加载数据超过10条
    if (false) {
      // 加载更多 loading
      that.setData({
        hothidden: false
      });
    } else {
      that.loadConnections();//query paginated data
    }
  },
});
