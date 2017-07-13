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
    // 处理显示时间
    function dateFormate(time) {
        var date = time;
        if (!(time instanceof Date)) {
            date = new Date(time);
        }
        var m = date.getMonth() + 1,
            dt = date.getDate(),
            h = date.getHours(),
            M = date.getMinutes(),
            s = date.getSeconds();
        return "" + m + "/" + dt + " " + addZero(h) + ":" + addZero(M) + ":" + addZero(s);
    }

    function addZero(num) {
        if (isNaN(+num)) {
            return num;
        }
        var n = +num;
        return n < 10 ? '0' + n : '' + n;
    }

    function findBoxAllUser(param) {
        $.ajax({
                url: '/api/findBoxAllUser.json',
                type: 'GET',
                dataType: 'JSON',
                data: param
            })
            .done(function(response) {
                console.log(response);
                if (response.success) {
                    var items = response.items,
                        trStr = '';
                    items.forEach(function(elem, index) {
                        trStr += '<tr><td>' + (index + 1) + '</td><td>' + (elem.createTime) + '</td><td>' + (elem.id) + '</td><td>' + (elem.openId) + '</td></tr>';
                    });
                    $("#boxUserBody").html(trStr);

                }
            });
    }
    var hostId = getQueryString('hostId'),
        company = getQueryString("company");
    $("#hostid").html(hostId + "-" + company);
    findBoxAllUser({ hostId: hostId });
});