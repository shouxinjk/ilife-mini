const util = require('../../../utils/util.js');
const app = getApp();

Page({
  data: {
    //页面配置
    winWidth: 0,
    winHeight: 0,
    // activity数据
    datalist: [],    
    userInfo: {},
    order: {
      icon: 'images/order.png',
      text: '我的生活',
      tip: '',
      url: '../feeds/feeds?person=0'
    },
    personas:[],
    candidateTags:[],
    colorful:[],//通过计算设置每一个标签是否采用高亮颜色
    tags:[],
    colors:[],//设置一个颜色列表

    // 收货数量
    orderBadge: {
      unpaid: 100,
      undelivered: 20,
      unreceived: 43
    },
    orderCell: [
      {
        icon: '../../../images/to-be-received.png',
        text: '种草',
        url: '../orders/orders?t=unreceived',
        class: 'order-cell-icon-small'
      }, {
        icon: '../../../images/to-be-delivered.png',
        text: '养草',
        url: '../orders/orders?t=undelivered',
        class: 'order-cell-icon-small',
      }, {
        icon: '../../../images/to-be-paid.png',
        text: '拔草',
        url: '../orders/orders?t=unpaid',
        class: 'order-cell-icon-big'
      }
    ],
    list: [
      {
        icon: 'images/feedback.png',
        text: '意见反馈',
        tip: '',
        cut: true,
        url: '../feedback/feedback'
      }, {
        icon: 'images/about.png',
        text: '关于上色',
        tip: '',
        url: '../about/about'
      }
    ]
  },

  loadPersonas: function () {
    var that = this;
    util.AJAX("persona/personas", function (res) {
      var arr = res.data;
      //console.log(arr);
      var plist = that.data.personas;
      var ctaglist = that.data.candidateTags;
      //we only load 3 top personas
      for (var i = 0; i < arr.length && i < 3; i++) {
        //console.log(arr[i]);
        plist=plist.concat(arr[i]);
        ctaglist=ctaglist.concat(arr[i].tags);//load candidate tags
      }
      var colorfulArray = [];
      for(var j=0;j<ctaglist.length;j++){
        colorfulArray = colorfulArray.concat(that.data.tags.indexOf(ctaglist[j])>-1?true:false);
      }
      console.log(plist, ctaglist, colorfulArray);
      that.setData({
        personas: plist,
        candidateTags: ctaglist,
        colorful: colorfulArray
      });
    });
  },

  loadTagColors:function(){
    var that = this;
    var rgbs = [];
    for(var i=0;i<200;i++){//默认构建一个200种颜色的数组
      var r = Math.floor(Math.random() * 256); //随机生成256以内r值
      var g = Math.floor(Math.random() * 256); //随机生成256以内g值
      var b = Math.floor(Math.random() * 256); //随机生成256以内b值
      rgbs=rgbs.concat(`rgb(${r},${g},${b})`); //返回rgb(r,g,b)格式颜色
    }
    //console.log(rgbs);
    that.setData({
      colors:rgbs
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

  //load user info by user id
  loadPerson: function (id) {
    var that = this
    util.AJAX("user/users/" + id, function (res) {
      if (app.globalData.isDebug) console.log("Query user.[id]" + id, res);
      that.setData({
        userInfo:res.data
      });
      //change page title
      wx.setNavigationBarTitle({
        title: that.data.userInfo.nickName
      })
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

  //点击触发
  onShow(){

  },

  onLoad(options) {
    console.log("user/profile/user.",options);
    var that = this;
    that.loadPersonas();
    that.loadTagColors();
    that.setData({
      //userInfo: app.globalData.userInfo, //需要使用被查看用户的信息
      tags:app.globalData.userInfo.tags
    });
    console.log(that.data.tags);
    that.loadData();
    that.loadPerson(options.id);
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

  onReady: function () {

  }, 

  onShareAppMessage: function (res) {
    var that = this
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: that.data.userInfo.nickName,
      path: '/pages/user/profile/user?id=' + that.data.userInfo._key
    }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (e.currentTarget.dataset.url) {
      wx.navigateTo({
        url: '/pages/user/profile/profile?id=' + url
      });
    } else {
      console.error("cannot navigate to user profile.[id]",url);
    }
  }
});
