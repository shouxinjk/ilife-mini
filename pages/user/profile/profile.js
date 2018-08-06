const util = require('../../../utils/util.js');
const app = getApp();

Page({
  data: {
    userInfo: {},
    order: {
      icon: 'images/order.png',
      text: '我的生活',
      tip: '',
      url: '../feeds/feeds?person=0'
    },
    personas: [],
    candidateTags: [],
    colorful: [],//通过计算设置每一个标签是否采用高亮颜色
    tags: [],
    colors: [],//设置一个颜色列表

    // 收货数量
    orderBadge: {
      unpaid: 0,
      undelivered: 0,
      unreceived: 0
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
        plist = plist.concat(arr[i]);
        ctaglist = ctaglist.concat(arr[i].tags);//load candidate tags
      }
      var colorfulArray = [];
      for (var j = 0; j < ctaglist.length; j++) {
        colorfulArray = colorfulArray.concat(that.data.tags.indexOf(ctaglist[j]) > -1 ? true : false);
      }
      console.log(plist, ctaglist, colorfulArray);
      that.setData({
        personas: plist,
        candidateTags: ctaglist,
        colorful: colorfulArray
      });
    });
  },

  //load user info by user id
  loadPerson: function (id) {
    var that = this
    util.AJAX("user/users/" + id, function (res) {
      if (app.globalData.isDebug) console.log("Query user.[id]" + id, res);
      that.setData({
        userInfo: res.data
      });
      //change page title
      wx.setNavigationBarTitle({
        title: that.data.userInfo.nickName
      })
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

  countOrder(orderList) {
    /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
    this.orderBadge = { unpaid: 0, undelivered: 0, unreceived: 0 };

    for (let i = orderList.length - 1; i >= 0; i--) {
      switch (orderList[i].order_status) {
        case '待支付': this.orderBadge.unpaid += 1; break;
        case '待发货': this.orderBadge.undelivered += 1; break;
        case '待收货': this.orderBadge.unreceived += 1; break;
        default: break;
      }
    }
    this.data.orderCell[0].count = this.orderBadge.unpaid;
    this.data.orderCell[1].count = this.orderBadge.undelivered;
    this.data.orderCell[2].count = this.orderBadge.unreceived;
    this.setData({
      orderBadge: this.orderBadge,
      orderCell: this.data.orderCell
    });
  },
  //点击触发
  onShow() {

  },
  onLoad(option) {
    this.loadPersonas();
    this.loadTagColors();
    this.setData({
      //userInfo: app.globalData.userInfo,//load user by id
      tags: app.globalData.userInfo.tags
    });
    this.loadPerson(option.id);
    //console.log(this.data.tags);
  },
  onReady: function () {
    // 页面渲染完成:修改页面标题
    // 有可能执行时异步调用尚未返回
    /*
    wx.setNavigationBarTitle({
      title: this.data.userInfo.nickName
    })
    //*/
  },  
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (e.currentTarget.dataset.url) {
      wx.navigateTo({
        url: 'user-info/user-info'
      });
    } else {
      if (url === undefined) {
        wx.makePhoneCall({
          phoneNumber: e.currentTarget.dataset.tip
        });
      } else {
        wx.navigateTo({
          url
        });
      }
    }
  }
});
