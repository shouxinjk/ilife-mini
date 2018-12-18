const util = require('../../utils/util.js');
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

    currentActionType: 0,//当前浏览的操作类型
    tagging: "",//操作类型对应的action_type

    page: {//翻页控制
      size: 20,//每页条数
      total: 1,//总页数
      current: -1//当前翻页
    },

    // 收货数量
    orderBadge: {
      unpaid: 100,
      undelivered: 20,
      unreceived: 43
    },
    orderCell: [
      {
        id: 'type-like',
        icon: '../../images/to-be-delivered.png',
        text: '养草',
        url: '../orders/orders?t=undelivered',
        tagging: 'like view',//已收藏
        class: 'order-cell-icon-small',
      }, {
        id: 'type-buy',
        icon: '../../images/to-be-paid.png',
        text: '拔草',
        url: '../orders/orders?t=unpaid',
        tagging: 'buy',//已购买
        class: 'order-cell-icon-big'
      }, {
        id: 'type-share',
        icon: '../../images/to-be-received.png',
        text: '种草',
        url: '../orders/orders?t=unreceived',
        tagging: 'share',//已分享
        class: 'order-cell-icon-small'
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

  //更改Action Type
  changeActionType: function (e) {
    var that = this;
    var ids = e.currentTarget.dataset.id;
    var tagging = e.currentTarget.dataset.tagging;
    if (app.globalData.isDebug) console.log("User::changeActionType [id]" + ids);
    var page = that.data.page;
    page.current = -1;//从第一页开始查看
    this.setData({
      currentActionType: that.data.currentActionType==ids?"0":ids,//如果重新点击当前类型则取消
      tagging: that.data.currentActionType == ids ? "" : tagging,//如果重新点击当前类型则取消,
      page: page,//恢复翻页
      datalist: [] //clear current datalist
    });
    that.loadData();
  },


  //load my stuff
  loadData: function () {
    var that = this
    /////////
    console.log("User::loadActions", app.globalData.userInfo._key);
    var that = this
    ////////////////
    //设置query
    var esQuery = {//搜索控制
      from: (that.data.page.current + 1) * that.data.page.size,
      size: that.data.page.size,
      query: {
        bool: {
          must: [
            {
              "match": {
                "userId": app.globalData.userInfo._key
              }
            }
          ]
        }
      },
      collapse: {
        field: "itemId"//根据itemId 折叠，即：一个item仅显示一次
      },
      sort: [
        { "weight": { order: "desc" } },//权重高的优先显示
        { "@timestamp": { order: "desc" } },//最近操作的优先显示
        { "_score": { order: "desc" } }//匹配高的优先显示
      ]
    };
    if (that.data.tagging.trim().length>0){//如果设置了操作类型，如种草、拔草、养草，则设置过滤条件
      esQuery.query.bool.must.push({
        "match": {
          "action": that.data.tagging
        }
      });
    }
    //设置请求头
    var esHeader = {
      "Content-Type": "application/json",
      "Authorization": "Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
    };
    util.AJAX("https://data.pcitech.cn/actions/_search", function (res) {
      console.log("now parsing search result.",res);
      if (res.data.hits.hits.length == 0) {//如果没有更多，则显示提示文字
        that.setData({
          showloading: false,
          shownomore: true
        });
      } else {
        var arr = res.data.hits.hits;// 获取结果
        var list = that.data.datalist;
        for (var i = 0; i < arr.length; i++) {//将搜索结果放入列表
          var record = arr[i]._source;
          list.push(record.item);
        }

        //更新翻页信息
        var total = res.data.hits.total;//获取匹配总数
        var page = that.data.page;
        page.total = (total + page.size - 1) / page.size;
        page.current = page.current + 1;
        that.setData({ page: page });

        // 然后重新写入数据
        that.setData({
          datalist: list,// 存储数据
          showloading: false,
          shownomore: false
        });
      }
    }, "post", JSON.stringify(esQuery), esHeader);    
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

  //点击触发
  onShow(){

  },

  onLoad() {
    var that = this;
    that.loadPersonas();
    that.loadTagColors();
    that.setData({
      userInfo: app.globalData.userInfo,
      tags:app.globalData.userInfo.tags
    });
    console.log(that.data.tags);
    that.loadData();//默认加载所有操作历史
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

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    console.log("now jump to profile page.[id]",url);
    if (e.currentTarget.dataset.url) {
      wx.navigateTo({
        url: 'profile/profile?id=' +url
      });
    } else {
      console.error("Cannot navigate to profile.[id]",url);
    }
  }
});
