//index.js
//获取应用实例
//获取应用实例
const util = require('../../utils/util.js');
var app = getApp()
Page({
  data: {
    msg:{
      slogan: "上色：让小确幸充满你的大生活",
      guide: "有个小问题，你想过什么样的生活？",
      btnInactive: "选一个你想要的生活",
      btnActive: "立即体验",
    },
    isReady:false,
    currentPersona:0,

    winWidth: 0,
    winHeight: 0,
    // 主数据
    mode:"create",//模式：是创建还是修正，对于已经创建的情况自动进入主界面，对于修正则停留待修改
    datalist: [],
    imagesHeightList: []
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (options) {
    var that = this
    //if PERSONA passed we will set it as the default one
    that.setData({
      currentPersona: options.persona ? options.persona : 0,
      mode:options.mode ? options.mode : 'create'
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
    that.loadData();

    util.flightCheck({
      success:function(res){
        console.log("Index::Onload login success.",res.data);
        that.setData({
          openid: res.data.openid
        });
        //check and push user info to server side if it is a new one
        util.checkPerson(res.data.openid,that.checkPersonCallback);
      },
      fail:function(res){
        console.log("Index::Onload login failed.",res)
      }
    });

    //that.login();
  },
  loadData: function () {
    /**
    * 发送请求数据
    */
    var that = this
    util.AJAX("persona/personas", function (res) {
      var arr = res.data;
      var list = that.data.datalist;
      // 然后重新写入数据
      that.setData({
        datalist: list.concat(arr)  // 存储数据，预留分页功能，可以附加数据
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
  },
  WxMasonryImageLoad: function (e) {
    var that = this;
    //console.log(e.detail.height);
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

  //更改Persona
  changePersona: function(e){
    var ids = e.currentTarget.dataset.id;
    if (app.globalData.isDebug) console.log("Index::onGetUserInfo Change persona.[id]"+ids);
    this.setData({ isReady: true, currentPersona:ids});
  },

/*
  //登录获取code
  login: function () {
    var that = this;
    wx.login({
      success: function (res) {
        console.log("login success.",res.code)
        //发送请求获取openid
        wx.request({
          url: 'https://data.shouxinjk.net/util/wxLogin.php', //接口地址
          data: { code: res.code },
          header: {
            'content-type': 'application/json' //默认值
          },
          success: function (res) {
            console.log(res.data);
            that.setData({
              openid: res.data.openid
            });
            //check and push user info to server side if it is a new one
            that.checkPerson();
          }
        })
      },
      fail: function (res) {//I am afraid we have to save to locale storage
        console.error("login failed.", res);
      }
    })
  },
//*/
  onGetUserInfo: function (e) {
    var that = this;
    if (app.globalData.isDebug) console.log(e);
    //通过调用wx.getUserInfo处理用户未授权情况
    wx.getUserInfo({
      success: function (res) {//同意授权，使用返回数据构建UserInfo
        console.log("Index::onGetUserInfo 已同意授权",res.userInfo)
        app.globalData.userInfo = e.detail.userInfo;
        app.globalData.hasUserInfo = true;
        that.setData({
          userInfo: e.detail.userInfo
        });
        util.updatePerson(that.data.openid,e.detail.userInfo,that.updatePersonCallback);
        //that.updatePerson(e.detail.userInfo);
      },
      fail: function (res) {//不同意授权，使用默认信息构建UserInfo
        console.log("Index::onGetUserInfo 拒绝授权", res);
        //这里需要进行默认处理：
        //使用默认的Persona、
        //获取用户普通信息，但缺乏用户OpenId，需要通过本地存储计算
        wx.showToast({//吐槽一下，我要的你都不给，我好伤心
          title: '被拒绝的感觉好伤心，可还是要和你在一起',
          icon: 'none',
          duration: 2000
        })
      }
    })
    //

  },

  //checkPersonCallback
  checkPersonCallback:function(res) {
    var that = this;
    if (app.globalData.isDebug) console.log("Index::checkPersonCallback Query if user exists.[openid]" + that.data.openid, res);
    if (res.data._key == that.data.openid) {
      if (app.globalData.isDebug) console.log("Index::checkPersonCallback The user exists.show home page");
      //set active userInfo
      app.globalData.userInfo = res.data;
      if (that.data.mode == 'create') {//create模式下设置后直接进入首页
        wx.switchTab({
          url: '/pages/home/home',
        })
      } else {//否则停留在选择页面，等待用户重新选择
        console.log("Index::checkPersonCallback index page is waiting for revising user settings.[mode]",that.data.mode);
      }
    } else {
      if (app.globalData.isDebug) console.log("Index::checkPersonCallback It is a new user. We will create one.");
      util.createPerson(that.data.openid, that.createPersonCallback);
    }
  },  

  //createPersonCallback
  createPersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Index::createPersonCallback",res);
  },  

  //updatePersonCallback
  updatePersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Index::updatePersonCallback", res);
    //set active userInfo
    app.globalData.userInfo = res.data;
    //navigate to home page
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

/*
  //check if user exists
  checkPerson: function () {
    var that = this
    util.AJAX("user/users/" + that.data.openid, function (res) {
      if(app.globalData.isDebug)console.log("Query if user exists.[openid]"+that.data.openid,res);
      if(res.data._key==that.data.openid){
        if (app.globalData.isDebug) console.log("The user exists.show home page");
        //set active userInfo
        app.globalData.userInfo = res.data;
        if(that.data.mode =='create'){//create模式下设置后直接进入首页
          wx.switchTab({
            url: '/pages/home/home',
          })
        }else{//否则停留在选择页面，等待用户重新选择
          console.log("index page is waiting for revising user settings.");
        }
      }else{
        if (app.globalData.isDebug) console.log("It is a new user. We will create one.");
        that.createPerson();
      }
    }, "GET");
  },

  createPerson: function () {
    var that = this
    util.AJAX("user/users", function (res) {
      //if(app.globalData.isDebug)console.log(res);
    },"POST",{"_key":that.data.openid});
  },

  updatePerson: function (data) {
    var that = this;
    //notice: miniProgram doesn't support method PATCH. we have to walk around
    var url = "https://data.shouxinjk.net/util/wxPatch.php?collection=user/users&key=" + that.data.openid + "&data=" + JSON.stringify(that.data.userInfo);
    //if (app.globalData.isDebug) console.log("update person.[url]"+url);
    //if (app.globalData.isDebug) console.log(JSON.stringify(that.data.userInfo));
    util.AJAX(url, function (res) {
      if (app.globalData.isDebug) console.log("update finished. now switch to home.",res);
      //set active userInfo
      app.globalData.userInfo = res.data;
      //navigate to home page
      wx.switchTab({
        url: '/pages/home/home'
      })
    }, "PUT", data, { "Api-Key": "foobar"});
  },

  //*/
})
