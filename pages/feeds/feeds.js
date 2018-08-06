//index.js
//获取应用实例
//获取应用实例
const util = require('../../utils/util.js');
var app = getApp()
Page({
  data: {
    //页面配置
    winWidth: 0,
    winHeight: 0,
    // 数据
    datalist: [],
    persons: [],
    currentPerson: 0
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (options) {
    console.log('onLoad', options);
    var that = this

    that.setData({
      persons: that.data.persons.concat(app.globalData.userInfo),
      currentPerson: options.person ? options.person :app.globalData.userInfo._key
    });
    /**
    * 获取系统信息
    */
    wx.getSystemInfo({

      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }

    });
    that.loadPersons();
    that.loadData();
  },

  //load related persons
  loadPersons: function () {
    var that = this
    util.AJAX("user/users", function (res) {
      var arr = res.data;
      var list = that.data.persons;
      that.setData({
        persons: list.concat(arr),// 存储数据
      });
    });
  },

  //load my stuff
  loadData: function () {
    var that = this
    util.AJAX("my/stuff", function (res) {
      var arr = res.data;
      // 获取当前数据进行保存
      var list = that.data.datalist;
      // 然后重新写入数据
      that.setData({
        datalist: list.concat(arr),// 存储数据
      });
    });
  },
  /**
     * 事件处理
     * scrolltolower 自动加载更多
     */
  scrolltolower: function (e) {

    var that = this;

    // 加载更多 loading
    that.setData({
      hothidden: true
    })

    var currentDate = this.data.dataListDateCurrent;

    // 如果加载数据超过10条
    if (this.data.dataListDateCount >= 8) {

      // 加载更多 loading
      that.setData({
        hothidden: false
      });

    } else {
      that.loadData();//query paginated data
    }
  },

  //更改Person
  changePerson: function (e) {
    var that = this;
    var ids = e.currentTarget.dataset.id;
    if (app.globalData.isDebug) console.log("Change person.[id]" + ids);
    this.setData({
      currentPerson: ids,
      datalist: [] //clear current datalist
    });
    //TODO: refresh detailed items by currentCategory
    that.loadData();
  },

  WxMasonryImageLoad: function (e) {
    var that = this;
    console.log(e.detail.height);
    // var colWidth = (that.data.winWidth - 20) / 2;
    // var imageId = e.target.id;
    // var imageOWidth = e.detail.width;
    // var imageOHeight = e.detail.height;

    // var colImageHeight = imageOWidth * colWidth / imageOHeight;
    // var temImagesHeightList = that.imagesHeightList;
    // temImagesHeightList[imageId] = { width: colWidth, height: colImageHeight }
    // that.setData({
    //   imagesHeightList: temImagesHeightList
    // });

  },

  /**
  * 页面相关事件处理函数--监听用户下拉动作
  */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  //点击TabBar后消除红点
  onTabItemTap(item) {
    console.log("onTabItemTap",item);
    wx.removeTabBarBadge(item);
  }
})
