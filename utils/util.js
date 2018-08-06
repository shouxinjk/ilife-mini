
// 加载配置文件
const config = require( '../config.js' );
var app = getApp();
function formatTime( date ) {

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}

function formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
}

// 格式化时间戳
function getTime( timestamp ) {
    var time = arguments[ 0 ] || 0;
    var t, y, m, d, h, i, s;
    t = time ? new Date( time * 1000 ) : new Date();
    y = t.getFullYear();    // 年
    m = t.getMonth() + 1;   // 月
    d = t.getDate();        // 日

    h = t.getHours();       // 时
    i = t.getMinutes();     // 分
    s = t.getSeconds();     // 秒

    return [ y, m, d ].map( formatNumber ).join('-') + ' ' + [ h, i, s ].map( formatNumber ).join(':');
    
}

module.exports = {

    formatTime: formatTime,
    getTime : getTime,

    //AJAX 调用
    AJAX : function( url = '', fn, method = "get",data={}, header = {}){
      if(config.isDebug)console.log("Util::AJAX",url,method,data,header);
      var fullURL = url.startsWith("http") ? url : config.API_HOST + url;
        wx.request({
            url: fullURL,
            method : method ? method : 'get',
            data: data?data:{"error":"something is wrong"},
            header: header ? header : {"Content-Type":"application/json"},
            success: function( res ) {
                fn( res );
            }
        });
    },

    //检查用户信息及登录状态
    //example: flightCheck({success,fail})
    flightCheck:function(options){
      var that=this;
      if (app.globalData.isDebug) console.log("Util::flightCheck [options]",options);
      if(app.globalData.userInfo){
        console.log("Util::flightCheck UserInfo exists.",app.globalData.userInfo);
      }else{
        //login and checkPerson
        console.log("Util::flightCheck UserInfo doesn't exist. Try login.", app.globalData.userInfo);
        that.login(options);
      }
    },

  //登录并获取openid
  //登录获取code
  //example: login({success,fail})
  login: function (options) {
    wx.login({
      success: function (res) {
        console.log("Util::login success.", res.code)
        //发送请求获取openid
        wx.request({
          url: 'https://data.shouxinjk.net/util/wxLogin.php', //接口地址
          data: { code: res.code },
          header: {
            'content-type': 'application/json' //默认值
          },
          success: function (res) {
            //run success callback
            if (typeof options.success === "function") {
              options.success(res);
            } else {
              console.log("Util::login only accept callback function as options.success.");
            }
          },
          fail: function (res){
            //do nothing
          }
        })
      },
      fail: function (res) {//I am afraid we have to save to locale storage
        console.error("Util::login login failed.", res);
        wx.showToast({
          title: '获取用户信息失败，请重新尝试',
          icon:'none',
          duration:2000
        })
      }
    })
  },

  //check if user exists
  //检查用户是否存在
  //checkPerson({data,callback})
  checkPerson: function (id,callback) {
    var that = this
    that.AJAX("user/users/" + id, function (res) {
      if (typeof callback === "function") {
        callback(res);
      }else{
        console.log("Util::checkPerson only accept callback function as parameter.");
      }
    }, "GET");
  },

  createPerson: function (id,callback) {
    console.log("Util::createPerson.",id);
    var that = this;
    that.AJAX("user/users", function (res) {
      if (typeof callback === "function") {
        callback(res);
      } else {
        console.log("Util::createPerson only accept callback function as parameter.");
      }
    }, "POST", { "_key": id });
  },

  updatePerson: function (id,userInfo,callback) {
    var that = this;
    //notice: miniProgram doesn't support method PATCH. we have to walk around
    var url = "https://data.shouxinjk.net/util/wxPatch.php?collection=user/users&key=" + id + "&data=" + JSON.stringify(userInfo);
    //if (app.globalData.isDebug) console.log("update person.[url]"+url);
    //if (app.globalData.isDebug) console.log(JSON.stringify(that.data.userInfo));
    that.AJAX(url, function (res) {
      if (typeof callback === "function") {
        callback(res);
      } else {
        console.log("Util::updatePerson only accept callback function as parameter.");
      }
    }, "GET", {}, { "Api-Key": "foobar" });
  },

    /**
     * 获取格式化日期
     * 20161002
     */
    getFormatDate : function( str ) {
            
        // 拆分日期为年 月 日
        var YEAR = str.substring( 0, 4 ),
            MONTH = str.substring( 4, 6 ),
            DATE = str.slice( -2 );

        // 拼接为 2016/10/02 可用于请求日期格式
        var dateDay = YEAR + "/" + MONTH + "/" + DATE;

        // 获取星期几
        var week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
            day = new Date( dateDay ).getDay();

        // 获取前一天日期 根据今天日期获取前一天的日期
        // var dateBefore = new Date( new Date( dateDay ) - 1000 * 60 * 60 * 24 ).toLocaleDateString();
        // var dateBefore = dateBefore.split('/');
        // if( dateBefore[1] < 10 ) {
        //     dateBefore[1] = '0' + dateBefore[1];
        // }
        // if( dateBefore[2] < 10 ) {
        //     dateBefore[2] = '0' + dateBefore[2];
        // }
        // dateBefore = dateBefore.join('');

        return {
            "dateDay" : MONTH + "月" + DATE + "日 " + week[ day ]
        }

    },

}
