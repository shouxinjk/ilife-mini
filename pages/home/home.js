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
    categories: [{id:0,name:"推荐"}],

    currentCategory:0
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (options) {
    console.log('Home::onLoad',options);
    var that = this

    //用户信息检查
    util.flightCheck({
      success: function (res) {
        console.log("Home::Onload login success.", res.data);
        that.setData({
          openid: res.data.openid
        });
        //check and push user info to server side if it is a new one
        util.checkPerson(res.data.openid, that.checkPersonCallback);
      },
      fail: function (res) {
        console.log("Home::Onload login failed.", res)
      }
    });

    //处理分享进入
    that.processShareMsg(options);//对于通过分享页进入的情况进行处理

    that.setData({
      currentCategory: options.category ? options.category:0
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
    that.loadCategory();
    that.loadData();
    //显示TabBar红点和数字
    //TODO 应该在回调里完成
    that.setRedPoint();
  },

  //load categories
  loadCategory: function () {
    var that = this
    util.AJAX("category/categories", function (res) {
      var arr = res.data;
      var list = that.data.categories;
      //TODO 加载每一个类别下自上次登录后的更新情况，如果有更新则显示小红点
      var catListWithNumbers = [];
      for(var i=0;i<arr.length;i++){
        var cat = arr[i];
        cat.numbers = Math.floor(Math.random()*10);
        list = list.concat(cat);
      }
      that.setData({
        //categories: list.concat(arr),// 存储数据
        categories: list,// TODO
      });
    });
  },

  //清除类别上的红点提示
  clearRedPoint:function(){
    var that = this;
    var list = that.data.categories;
    //消除当前浏览分类的小红点
    var newlist = [];
    for (var i = 0; i < list.length; i++) {
      var cat = list[i];
      //console.log("Clear red point", cat);
      if(cat.id==that.data.currentCategory){
        cat.numbers = 0;
      }
      newlist = newlist.concat(cat);
    }
    that.setData({
      categories: newlist
    });
  },

  //设置TabBar红点和数字提示
  setRedPoint:function(){
    wx.setTabBarBadge({
      index: 0,
      text: '126'
    });    
    wx.setTabBarBadge({
      index: 1,
      text: '23'
    });
    wx.showTabBarRedDot({
      index: 2
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

  //更改Category
  changeCategory: function (e) {
    var that=this;
    var ids = e.currentTarget.dataset.id;
    if (app.globalData.isDebug) console.log("Home::changeCategory [id]" + ids);
    this.setData({ 
      currentCategory: ids,
      datalist:[] //clear current datalist
    });
    //TODO: clear red-point of current cateogry
    that.clearRedPoint();
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
    console.log("Home::onTabItemTap", item);
    wx.removeTabBarBadge(item);
  },

  //checkPersonCallback
  checkPersonCallback: function (res) {
    var that = this;
    if (app.globalData.isDebug) console.log("Home::checkPersonCallback Query if user exists.[openid]" + that.data.openid, res);
    if (res.data._key == that.data.openid) {
      if (app.globalData.isDebug) console.log("Home::checkPersonCallback The user exists.show home page");
      //set active userInfo
      app.globalData.userInfo = res.data;
    } else {
      if (app.globalData.isDebug) console.log("Home::checkPersonCallback It is a new user. We will create one.");
      util.createPerson(that.data.openid, that.createPersonCallback);
    }
  },

  //createPersonCallback
  createPersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Home::createPersonCallback", res);
  },

  //updatePersonCallback
  updatePersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Home::updatePersonCallback", res);
    //set active userInfo
    app.globalData.userInfo = res.data;
  },

  //处理带有分享用户及分享信息的情况
  processShareMsg: function (options) {
    console.log("Home::processShareMsg Process share information.", options);
    /** 判断场景值，1044 为转发场景，包含shareTicket 参数 */
    if (options.scene == 1044) {
      wx.getShareInfo({
        shareTicket: options.shareTicket,
        success: function (res) {
          console.log("Home::processShareMsg Process share scene success.", res);
          var encryptedData = res.encryptedData;
          var iv = res.iv;
        },
        fail: function (res) {
          console.log("Home::processShareMsg Process share scene failed.", res);
        },
        complete: function (res) {
          console.log("Home::processShareMsg Process share scene complete.", res);
        },
      })
    }
    if (options.share) {//带有share信息，需要处理跳转到指定页面
      console.log("Home::processShareMsg Landing from share page.", options);
      //建立默认链接
      //判定并修改用户persona
      //根据用户是否授权显示授权按钮
      //跳转到指定页面
      wx.showLoading({
        title: '小确幸大生活',
      })
      setTimeout(function () {
        wx.hideLoading()
        switch(options.share){
          case "detail":
            var share_query = JSON.parse(options.query);
            console.log("Home::processShareMsg Navigate to Detail page.", share_query);
            wx.navigateTo({
              url: '/pages/detail/detail?id=' + share_query.id+"&user="+share_query.user+"&persona="+share_query.persona,
            });
            break;
          default:
            console.log("Home::processShareMsg Unkown share page.",options.share);
        }
      }, 1500)
    } else {
      console.log("Detail::processShareMsg This is not a share page. ", options);
    }
  },
})
