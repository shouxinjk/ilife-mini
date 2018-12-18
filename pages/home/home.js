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
    categories: [{id:0,name:"推荐",tagging:""}],

    currentCategory:0,
    tagging:"",
    page:{//翻页控制
      size: 20,//每页条数
      total: 1,//总页数
      current: -1//当前翻页
    },
    esQuery:{//搜索控制
      from: 0,
      size: 20,//注意：需要手动设置为一致
      query: {
        match_all: {}
      },
      sort: [
        { "@timestamp": { order: "desc" } },
        { "_score": { order: "desc" } }
      ]
    }
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

  //加载列表
  loadData: function () {
    var that = this;
    var q = {
      match: {
        full_text: ""
      }
    };
    if (that.data.tagging.trim().length > 0) {//使用指定内容进行搜索
      q.match.full_text = that.data.tagging;
      that.data.esQuery.query = q;
    } else {//搜索全部
      that.data.esQuery.query = {
        match_all: {}
      };
    }
    //处理翻页并更新query
    var query = that.data.esQuery;
    query.from = (that.data.page.current + 1) * that.data.page.size;
    that.setData({//更新查询条件
      esQuery:query
    });
    //console.log("query object", that.data.esQuery);
    //设置请求头
    var esHeader = {
      "Content-Type": "application/json",
        "Authorization": "Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
    };
    util.AJAX("https://data.pcitech.cn/stuff/_search", function (res) {
      //console.log("now parsing search result.",res);
      if (res.data.hits.hits.length == 0) {//如果没有内容，则显示提示文字
        that.setData({
          showloading: false,
          shownomore: true
        });
      } else {
        var arr = res.data.hits.hits;// 获取结果
        var total = res.data.hits.total;//获取匹配总数

        var page = that.data.page;
        page.total = (total + page.size - 1) / page.size;
        page.current = page.current + 1;
        that.setData({page:page});//更新翻页信息

        var list = that.data.datalist;// 获取当前数据列表
        for (var i = 0; i < arr.length; i++) {//将搜索结果放入列表
          list.push(arr[i]._source);
        }

        // 然后重新写入数据
        that.setData({
          datalist: list,
          showloading:false,
          shownomore:false
        });
      }
      //console.log("page object", that.data.page);
    }, "post", JSON.stringify(that.data.esQuery), esHeader);
  },
  /**
     * 事件处理
     * scrolltolower 自动加载更多
     */
  scrolltolower: function (e) {

    var that = this;

    // 加载更多 loading
    that.setData({
      showloading: true
    })

    var currentDate = this.data.dataListDateCurrent;

    // 如果加载数据超过10条
    if (this.data.dataListDateCount >= 8) {

      // 加载更多 loading
      that.setData({
        showloading: false
      });

    } else {
      that.loadData();//query paginated data
    }
  },

  //更改Category
  changeCategory: function (e) {
    var that=this;
    var ids = e.currentTarget.dataset.id;
    var tagging = e.currentTarget.dataset.tagging;
    if (app.globalData.isDebug) console.log("Home::changeCategory [id]" + ids);
    var page = that.data.page;
    page.current = -1;//从第一页开始查看
    var query = that.data.esQuery;
    query.from = 0;//从第一页开始搜索
    this.setData({ 
      currentCategory: ids,
      tagging:tagging,
      page:page,//恢复翻页
      esQuery:query,//恢复搜索翻页
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
      console.log("Home::processShareMsg This is not landing from share page. ", options);
    }
  },
})
