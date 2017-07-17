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

    function findAllUserAuthority() {
        $.ajax({
                method: 'GET',
                url: '/api/findAllUserAuthority.json',
                dateType: 'JSON'
            })
            .done(function(response) {
                if (response.success) {
                    handleUserAuthority(response.items);
                } else {
                    alert(response.message);
                }
            });
    }

    function handleUserAuthority(items) {
        var table = $('#userAuthorityBody');
        var strContent = '';
        if (items instanceof Array) {
            items.forEach(function(item, index) {
                var userId = item.id;
                var checkArr = ['<input type="checkbox" diy-operate="reciveWarn" diy-userId="' + userId + '" click="bindCheckBoxListener()"', '>'];
                if (item.warn === "1") {
                    checkArr.splice(1, 0, "checked");
                }
                strContent += '<tr><td>' + (index + 1) + '</td><td>' + (item.openId) + '</td><td>' + (item.hostId) + '</td><td>' + checkArr.join("") + '</td></tr>';
            });
            table.html(strContent);
        } else {
            table.html('');
        }
    }

    // 接收通知
    function addUserAuthorityWarn(param, cb) {
        $.ajax({
            url: '/api/addUserAuthorityWarn.json',
            data: param,
            method: 'POST',
            dateType: 'JSON'
        }).done(function(response) {
            if (!response.success) {
                alert(response.message);
            } else {
                typeof cb === "function" && cb();
            }
        })
    }

    // 删除通知
    function removeUserAuthorityWarn(param, cb) {
        $.ajax({
            url: '/api/removeUserAuthorityWarn.json',
            method: 'POST',
            data: param,
            dateType: 'JSON'
        }).done(function(response) {
            if (!response.success) {
                alert(response.message);
            } else {
                typeof cb === "function" && cb();
            }
        })
    }

    // 绑定事件
    function bindCheckBoxListener() {
        $(document).on('change', '[diy-operate="reciveWarn"]', function(event) {
            var preState = $(this).attr('checked'),
                nextState = preState ? '' : 'checked';
            var userId = $(this).attr('diy-userId');
            if (nextState === 'checked') {
                $(this).attr('checked', nextState);
                addUserAuthorityWarn({ userId: userId });
            } else {
                $(this).removeAttr('checked');
                removeUserAuthorityWarn({ userId: userId });
            }
        })
    }

    (function() {
        var hostId = getQueryString('hostId');
        var company = getQueryString('company');
        $('#hostid').html(hostId + '-' + company);
        bindCheckBoxListener();
        findAllUserAuthority();
    })()


})