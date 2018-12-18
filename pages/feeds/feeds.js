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
    page: {//翻页控制
      size: 20,//每页条数
      total: 1,//总页数
      current: -1//当前翻页
    },

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
      //从列表内过滤掉当前用户：当前用户永远排在第一个
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i];
        if (u._key != app.globalData.userInfo._key){
          list = list.concat(u);
        }
      }      
      that.setData({
        persons: list,// 存储数据
      });
    });
  },

  //load my stuff
  loadData: function () {
    var that = this;
    console.log("Feed::loadData", that.data.currentPerson);
    //设置query
    var esQuery = {//搜索控制
      from: (that.data.page.current + 1) * that.data.page.size,
      size: that.data.page.size,
      query: {
        bool: {
          must: [
            {
              "match": {
                "userId": that.data.currentPerson
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
    //设置请求头
    var esHeader = {
      "Content-Type": "application/json",
      "Authorization": "Basic ZWxhc3RpYzpjaGFuZ2VtZQ=="
    };
    util.AJAX("https://data.pcitech.cn/actions/_search", function (res) {
      console.log("Feed::loadData now parsing search result.", res);
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

  //更改Person
  changePerson: function (e) {
    var that = this;
    var ids = e.currentTarget.dataset.id;
    if (app.globalData.isDebug) console.log("Feed::ChangePerson change person.[id]" + ids);
    var page = that.data.page;
    page.current = -1;//从第一页开始查看
    this.setData({
      currentPerson: ids,
      page:page,
      datalist: [] //clear current datalist
    });
    //TODO: refresh detailed items by currentCategory
    that.loadData();
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
