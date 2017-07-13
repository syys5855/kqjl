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
    function findOneDayList(param) {
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
                } else {
                    alert(response.message);
                }
            });
    }

    var hostId = getQueryString('hostId'), //获取hostId
        company = getQueryString('company'); //获取公司名字
    //获取当前日期
    var dayTime = Date.now;
    var b = new Date(dayTime - 3600 * 24 * 1000)
    console.log(dayTime, b)
    var day = new Date();
    console.log(day.getTime() - 3600 * 24 * 1000)
    var year = day.getFullYear();
    var month = day.getMonth() + 1;
    var days = day.getDate();
    var date = year + '/' + daysAddZero(month) + '/' + daysAddZero(days);

    function daysAddZero(num) {
        return num < 10 ? '0' + num : num;
    }

    $("#date").html(date);
    $("#companyName").html(company + "-" + hostId);

    //前一天后一天
    $('#goBack').bind('click', function() {
        daysLastDay(days, -1)
    });

    $('#goNext').bind('click', function() {
        daysLastDay(days, 1)
    });

    //判断日期
    function daysLastDay(d, sym) {
        month = parseInt(month, 10);
        var d = new Date(year, month, 0).getDate();
        var da = new Date(year, month - 1, 0).getDate();
        if (sym == 1) {
            if (days == d) {
                month += 1;
                days = 1;
            } else {
                days += 1;
            }
        } else {
            if (days == 1) {
                month -= 1;
                days = da;
            } else {
                days -= 1;
            }
        }

        var csdate = year + '/' + daysAddZero(month) + '/' + daysAddZero(days);

        findOneDayList({
            hostId: hostId,
            date: csdate
        });
    }
    findOneDayList({
        hostId: hostId,
        date: date
    });
});