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


    function boxWaterShow(items, dom) {
        dom = dom || $("#boxListBody");
        var trStr = "";
        items.forEach(function(elem, index) {
            trStr += '<tr><td>' + (dom.children().length + index + 1) + '</td><td>' + (elem.hostId) + '</td><td>' + (elem.hostIp) + '</td><td>' + (elem.version) + '</td><td>' + (elem.event) + '</td><td>' + (elem.result) + '</td><td>' + (elem.dateTime) + '</td></tr>';
        });
        dom.append(trStr);
    }
    // 获取一个盒子的流水记录
    function findBoxWaterById(param, callback) {
        $.ajax({
                url: '/api/findBoxWaterById.json',
                type: 'GET',
                dataType: 'JSON',
                data: param
            })
            .done(function(response) {
                if (response.success) {
                    var items = response.items;
                    $("#hostid").html(param.hostId + "-" + company);
                    typeof callback === "function" && callback(items);
                    g_lastTime = items.length > 0 && items[items.length - 1].dateTime;
                    if (items.length === 0) {
                        $("#btnLoad").attr('disabled', 'disabled').html('没有更多数据');
                    }
                } else {
                    alert(response.message);
                }
            });
    }

    var hostId = getQueryString('hostId'), //获取hostId
        company = getQueryString('company'),
        g_lastTime = undefined;
    paramBW = {
        hostId: hostId,
        pageSize: 100,
        lastTime: undefined
    };

    findBoxWaterById(paramBW, boxWaterShow);
    $("#btnLoad").on('click', function() {
        paramBW.lastTime = g_lastTime;
        findBoxWaterById(paramBW, boxWaterShow);
    })
});