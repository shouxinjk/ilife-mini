var app = getApp();
const util = require( '../../utils/util.js' );

Page( {
    data: {
        //swiper 配置
        indicatorDots: true,
        vertical: false,
        autoplay: true,
        circular: true,
        interval: 2000,
        duration: 500,
        previousMargin: 0,
        nextMargin: 0,      

        // 主数据
        userInfo:{},//当前用户，用于分享时或从分享进入引用
        accuracyThreshhold:0,//根据准确度判定提示用户修正persona，当前不做检查
        stuff: {},// 内容对象
        actions : [],  // 该内容下用户行为列表
        hosts:[],//推荐用户列表
        maxHosts: 5,//最多显示hosts个数
        foldHosts:false,//是否折叠显示hosts

        // 状态数据
        isLiked: false,

        // 系统信息
        winHeight: 0,   // 设备高度

        // 弹窗
        modalHidden: true,
        modalValue: null,

        //分享配置
        shareShow: 'none',
        shareOpacity: {},
        shareBottom: {},
    },

    // 根据ID请求Stuff数据
    loadData:function(stuff_id){
      var that = this;
      util.AJAX("my/stuff/" + stuff_id, function (res) {
        var data = res.data;
        console.log("Detail::loadStuff",data);
        that.setData({
          stuff: data,
          userInfo:app.globalData.userInfo
        });
        //change page title
        wx.setNavigationBarTitle({
          title: that.data.stuff.title
        });
        //更新收藏状态
        that.checkLikeStatus();
        //记录用户行为
        util.trace("view", {
          itemId: that.data.stuff._key,
          userId: app.globalData.userInfo._key,
          item: that.data.stuff,
          user: app.globalData.userInfo
        });
      });
    },

  //根据ID请求Hosts数据
  loadHosts: function (stuff_id) {
    console.log("Detail::loadHosts", stuff_id);
    var that = this
    ////////////////
    //设置query
    var esQuery = {//搜索控制
      from: 0,
      size: 30,//注意：当前仅固定取20条记录，通过排重后显示
      query: {
        bool: {
          must: [
            {
              "match": {
                "itemId": stuff_id
              }
            }
          ]
        }
      },
      sort: [
        { "weight": { order: "desc" } },
        { "@timestamp": { order: "desc" } },
        { "_score": { order: "desc" } }
      ]
    };
    //设置请求头
    var esHeader = {
      "Content-Type": "application/json",
      "Authorization": "Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
    };
    util.AJAX("https://data.pcitech.cn/actions/_search", function (res) {
      //console.log("now parsing search result.",res);
      if (res.data.hits.hits.length == 0) {//如果没有内容，则显示提示文字
        //do nothing
      } else {
        var numberOfHosts = 0;
        var arr = res.data.hits.hits;// 获取结果
        var list = [];
        var userIds = [];
        for (var i = 0; i < arr.length; i++) {//将搜索结果放入列表，需要根据用户ID排重
          var record = arr[i]._source;
          var uid = record.user._key;
          if(uid && userIds.indexOf(uid)<0){
            userIds.push(uid);
            list.push(record.user);
            numberOfHosts++;
          }
        }

        // 然后重新写入数据
        that.setData({
          hosts: list,// 存储数据
          foldHosts: numberOfHosts > that.data.maxHosts //少于3条则平铺，否则折叠为一行
        });
      }
    }, "post", JSON.stringify(esQuery), esHeader);

    /*
    //deprecated: load from db
    util.AJAX("user/users", function (res) {
      var arr = res.data;
      var list = [];
      var numberOfHosts = that.data.maxHosts;
      numberOfHosts = Math.floor(Math.random() * 10) + 1;//for test:we only add 
      for (var i = 0; i < numberOfHosts && i < arr.length; i++) {
        list = list.concat(arr[i]);
      }
      that.setData({
        hosts: list,// 存储数据
        foldHosts: numberOfHosts > that.data.maxHosts //少于3条则平铺，否则折叠为一行
      });
    });
    // */
  },

  // 根据ID请求用户行为：当前不生效
  loadActions: function (stuff_id) {
    console.log("Detail::loadActions", stuff_id);
    var that = this;
    util.AJAX("user/users", function (res) {
      var data = res.data;
      var list = [];
      var max = Math.floor(Math.random() * 10);//for test:we only add 
      for(var i=0;i<max && i<data.length;i++){
        list = list.concat(data[i]);
      }
      that.setData({
        actions: list
      });
    });
  },

  onLoad: function( options ) {
    // 页面初始化 options 为页面跳转所带来的参数
    var that = this
    console.log("Detail::onLoad detail page got params.", options);
    //用户信息检查
    util.flightCheck({
      success: function (res) {
        console.log("Detail::Onload login success.", res.data);
        that.setData({
          openid: res.data.openid
        });
        //check and push user info to server side if it is a new one
        util.checkPerson(res.data.openid, that.checkPersonCallback);
      },
      fail: function (res) {
        console.log("Detail::Onload login failed.", res)
      }
    });

    //处理分享进入
    that.processShareMsg(options);//对于通过分享页进入的情况进行处理

    //数据加载
    var id = options.id;
    that.loadData(id);//加载主数据
    that.loadHosts(id);//加载Hosts列表

    //获取系统信息
    wx.getSystemInfo( {
        success: function( res ) {
            that.setData( {
                winWidth: res.windowWidth,
                winHeight: res.windowHeight
            });
        }
    });

    //显示分享菜单
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  //checkPersonCallback
  checkPersonCallback: function (res) {
    var that = this;
    if (app.globalData.isDebug) console.log("Detail::checkPersonCallback Query if user exists.[openid]" + that.data.openid, res);
    if (res.data._key == that.data.openid) {
      if (app.globalData.isDebug) console.log("Detail::checkPersonCallback The user exists.show home page");
      //set active userInfo
      app.globalData.userInfo = res.data;
    } else {
      if (app.globalData.isDebug) console.log("Detail::checkPersonCallback It is a new user. We will create one.");
      util.createPerson(that.data.openid, that.createPersonCallback);
    }
  },

  //createPersonCallback
  createPersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Detail::createPersonCallback", res);
  },

  //updatePersonCallback
  updatePersonCallback: function (res) {
    if (app.globalData.isDebug) console.log("Detail::updatePersonCallback", res);
    //set active userInfo
    app.globalData.userInfo = res.data;
  },

  jump: function (e) {
    console.log("Detail::jump navigate to", e);
    const userId = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: "/pages/user/profile/user?id=" + userId
    });
  },

  //处理带有分享用户及分享信息的情况
  processShareMsg: function (options) {
    console.log("Detail::processShareMsg Process share information.", options);
    if (options.user) {//分享链接，但信息未处理
      console.log("Detail::processShareMsg Landing from share message. TODO recoginze new user and do something.", options);
      //建立默认链接
      //判定并修改用户persona
      //根据用户是否授权显示授权按钮
    } else {
      console.log("Detail::processShareMsg This is not a share page. ", options);
    }
  },

  onShareAppMessage: function (res) {
    var that = this
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log("Detail::onShareAppMessage Share from button.",res.target)
    }
    //准备分享参数
    var query_json={
      "id": that.data.stuff._key,
      "user": app.globalData.userInfo._key,
      "persona":"to_change_persona"
    };
    //记录用户行为
    util.trace("share", {
      itemId: that.data.stuff._key,
      userId: app.globalData.userInfo._key,
      item: that.data.stuff,
      user: app.globalData.userInfo
    });    
    return {
      title: that.data.stuff.title,
      //注意：为保证从分享页能够进入首页与主菜单，分享入口均通过home进行
      path: '/pages/home/home?share=detail&query='+JSON.stringify(query_json),
      success: function (t) {
        console.log("Detail::onShareAppMessage share message.",t)
        // console.log
        wx.getShareInfo({
          shareTicket: t.shareTickets[0],
          complete: function (t) { console.log(t) }
        });
      },
      fail: function (t) {
        // 分享失败
        console.log(t)
      }
    }
  },

  buy:function(e){
    var that = this;
    console.log("Detail::buy TODO. try to navigate to original page.",e);
    //记录用户行为
    util.trace("buy step1", {
      itemId: that.data.stuff._key,
      userId: app.globalData.userInfo._key,
      item: that.data.stuff,
      user: app.globalData.userInfo
    });   
    //将淘口令或URL复制到剪贴板 并提示用户后续操作
    wx.setClipboardData({
      data: "http://www.shouxinjk.net/list/go.html?id=" + that.data.stuff._key,//将URL设置到剪贴板
      success(res) {
        that.showShare(e);
        setTimeout(function () {//设置自动关闭提示
          that.shareClose();
        }, 2000)
      }
    });  
  },

  like:function (e) {
    var that = this;
    console.log("Detail::like TODO. try to like the item.", e);
    //记录用户行为
    util.trace("like", {
      itemId: that.data.stuff._key,
      userId: app.globalData.userInfo._key,
      item: that.data.stuff,
      user: app.globalData.userInfo
    },function(res){
      //更改收藏状态：这里使用简单方法：如果收藏操作发生为基数次则为“已收藏”  
      that.checkLikeStatus();
    });   
  },

  //修改收藏图标
  checkLikeStatus: function () {
    var that = this;
    //设置query
    var esQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                action: "like"
              }
            }, 
            {
              match: {
                userId: app.globalData.userInfo._key//userid
              }
            },
            {
              match: {
                itemId: that.data.stuff._key//itemid
              }
            }
          ]
        }
      }
    };
    //////////////////
    //设置请求头
    var esHeader = {
      "Content-Type": "application/json",
      "Authorization": "Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
    };
    //console.log("esQuery.",esQuery);
    util.AJAX("https://data.pcitech.cn/actions/doc/_count", function (res) {
      console.log("esQuery result.",res);
      if (res.data.count%2 == 0) {//如果为偶数则为已取消收藏
        that.setData({
          isLiked:false
        });
      } else {//否则为已收藏
        that.setData({
          isLiked:true
        });
      }
    }, "post", JSON.stringify(esQuery), esHeader);
  },

    /**
     * 显示分享
     */
    showShare: function( e ) {

        // 创建动画
        var animation = wx.createAnimation( {
            duration: 100,
            timingFunction: "ease",
        })
        this.animation = animation;

        var that = this;
        that.setData( {
            shareShow: "block",
        });

        setTimeout( function() {
            that.animation.bottom( 0 ).step();
            that.setData( {
                shareBottom: animation.export()
            });
        }.bind( this ), 400 );

        // 遮罩层
        setTimeout( function() {
            that.animation.opacity( 0.3 ).step();
            that.setData( {
                shareOpacity: animation.export()
            });
        }.bind( this ), 400 );

    },

    /**
     * 关闭分享
     */
    shareClose: function() {
        // 创建动画
        var animation = wx.createAnimation( {
            duration: 0,
            timingFunction: "ease"
        })
        this.animation = animation;

        var that = this;

        setTimeout( function() {
            that.animation.bottom( -50 ).step();
            that.setData( {
                shareBottom: animation.export()
            });
        }.bind( this ), 500 );

        setTimeout( function() {
            that.animation.opacity( 0 ).step();
            that.setData( {
                shareOpacity: animation.export()
            });
        }.bind( this ), 500 );

        setTimeout( function() {
            that.setData( {
                shareShow: "none",
            });
        }.bind( this ), 1500 );
    },

    /**
     * 点击分享图标弹出层
     */
    modalTap: function( e ) {
        var that = this;
        that.setData( {
            modalHidden: false,
            modalValue: e.target.dataset.share
        })
    },
    
    /**
     * 关闭弹出层
     */
    modalChange: function( e ) {
        var that = this;
        that.setData( {
            modalHidden: true
        })
    },

    onReady: function() {
        // 页面渲染完成:修改页面标题
        //不能在这里完成，执行时有可能AJAX尚未返回数据
        /*
        wx.setNavigationBarTitle( {
            title: this.data.stuff.title
        })
        //*/
    },
    onShow: function() {
        // 页面显示
    },
    onHide: function() {
        // 页面隐藏
    },
    onUnload: function() {
        // 页面关闭
    }
})