$(function() {
    // 获取url上的参数
    function getQueryString(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = window.location.search.substr(1).match(reg);
        if (r !== null) {
            return decodeURI(r[2]);
        }
        return null;
    }

    // 获取一个盒子的流水记录
    function findOneDayList(param, cb) {
        console.log(param)
        $.ajax({
                url: '/api/findOneDayUserList.json',
                type: 'GET',
                dataType: 'JSON',
                data: param
            })
            .done(function(response) {
                if (response.success) {
                    var items = response.items,
                        trStr = '';
                    console.log(response)
                    items.forEach(function(elem, index) {
                        trStr += '<tr><td>' + (index + 1) + '</td><td>' + (elem.userId) + '</td><td>' + (elem.firstTime) + '</td><td>' + (elem.lastTime) + '</td><td>' + (elem.openId) + '</td></tr>';
                    });
                    $("#daysListBody").html(trStr);
                    $("#date").html(param.date);
                    // $('#companyName').html(param.hostId)
                    // $("#hostid").html(param.hostId);
                    typeof cb === "function" && cb(param.date);
                } else {
                    alert(response.message);
                }
            });
    }

    function addZero(num) {
        return num < 10 ? '0' + num : num;
    }



    // 设置搜索时间的字符串格式 2017/03/02
    function toDateStr(date) {
        var year = date.getFullYear(),
            month = date.getMonth() + 1,
            days = date.getDate();
        return year + '/' + addZero(month) + '/' + addZero(days);
    }

    var hostId = getQueryString('hostId'), //获取hostId
        company = getQueryString('company'), //获取公司名字
        today = new Date();

    $("#companyName").html(company + "-" + hostId);
    //后一天
    $('#goBack').bind('click', function() {
        var dtstr = $("#date").html();
        var csdate = toDateStr(new Date(new Date(dtstr).getTime() - 24 * 60 * 60000));
        findOneDayList({
            hostId: hostId,
            date: csdate
        }, function(dateStr) {
            $("#date").html(dateStr);
        });
    });

    $('#goNext').bind('click', function() {
        var dtstr = $("#date").html();
        var csdate = toDateStr(new Date(new Date(dtstr).getTime() + 24 * 60 * 60000));
        findOneDayList({
            hostId: hostId,
            date: csdate
        }, function(dateStr) {
            $("#date").html(dateStr);
        });
    });

    findOneDayList({
        hostId: hostId,
        date: toDateStr(today)
    }, function(dateStr) {
        $("#date").html(dateStr);
    });
});