// 获取URL中的参数
/* 用法：
var Request = new Object();
Request = GetRequest();
var 参数1,参数2,参数3,参数N;
参数1 = Request['参数1'];
参数2 = Request['参数2'];
参数3 = Request['参数3'];
参数N = Request['参数N'];
*/
function getRequest() {
    var url = location.search; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}



Date.prototype.format = function (format) //author: meizz
{
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
      RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}


function formatJSONDate(jsonDate, format) {
    var date = new Date(parseInt(jsonDate.substr(6)));
    return date.format(format);
}

function randomInt() {
    return Math.round(Math.random() * 10000000000000);
}

function SerializeJsonToStr(oJson) {
    if (typeof (oJson) == typeof (false)) {
        return oJson;
    }
    if (oJson == null) {
        return "null";
    }
    if (typeof (oJson) == typeof (0))
        return oJson.toString();
    if (typeof (oJson) == typeof ('') || oJson instanceof String) {
        oJson = oJson.toString();
        oJson = oJson.replace(/\r\n/, '\\r\\n');
        oJson = oJson.replace(/\n/, '\\n');
        oJson = oJson.replace(/\"/, '\\"');
        return '"' + oJson + '"';
    }
    if (oJson instanceof Array) {
        var strRet = "[";
        for (var i = 0; i < oJson.length; i++) {
            if (strRet.length > 1)
                strRet += ",";
            strRet += SerializeJsonToStr(oJson[i]);
        }
        strRet += "]";
        return strRet;
    }
    if (typeof (oJson) == typeof ({})) {
        var strRet = "{";
        for (var p in oJson) {
            if (strRet.length > 1)
                strRet += ",";
            strRet += '"' + p.toString() + '":' + SerializeJsonToStr(oJson[p]);
        }
        strRet += "}";
        return strRet;
    }
}

function renderThisYear() {
    var date = new Date();
    document.write(1900 + date.getYear());
}