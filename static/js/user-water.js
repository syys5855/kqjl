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

    function findBoxUserWater(param, callback) {
        $.ajax({
                url: '/api/findBoxUserWater.json',
                type: 'GET',
                dataType: 'JSON',
                data: param
            })
            .done(function(response) {
                if (response.success) {
                    var items = response.items;
                    typeof callback === "function" && callback(items);
                    g_lastTime = items.length > 0 && items[items.length - 1].dateTime;
                    if (items.length === 0) {
                        $("#btnLoad").attr('disabled', 'disabled').html('没有更多数据');
                    }
                }
            });
    }

    function boxUserWaterShow(items, dom) {
        dom = dom || $("#userWaterBody");
        var trStr = "";
        items.forEach(function(elem, index) {
            trStr += '<tr><td>' + ($("#userWaterBody").children().length + index + 1) + '</td><td>' + (elem.userId) + '</td><td>' + (elem.openId) + '</td><td>' + (elem.event) + '</td><td>' + (elem.result) + '</td><td>' + (elem.dateTime) + '</td></tr>';
        });
        dom.append(trStr);
    }

    var hostId = getQueryString('hostId'),
        company = getQueryString('company'),
        inited = false,
        g_lastTime = undefined;

    paramBWU = {
        hostId: hostId,
        pageSize: 20,
        lastTime: undefined
    };
    $("#hostid").html(hostId + "-" + company);
    findBoxUserWater(paramBWU, boxUserWaterShow);
    // 点击加载更多
    $("#btnLoad").on('click', function() {
        paramBWU.lastTime = g_lastTime;
        findBoxUserWater(paramBWU, boxUserWaterShow);
    });
})