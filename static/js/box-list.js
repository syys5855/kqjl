$(function() {

    // 获取所有盒子的流水记录
    function findBoxAll() {
        $.ajax({
                url: '/api/findBoxAll.json',
                type: 'GET',
                dataType: 'JSON',
            })
            .done(function(response) {
                if (response.success) {
                    var items = response.items,
                        time = response.time,
                        trhtml = handleBoxList(items, time);
                    $("#boxListBody").html(trhtml);
                }
            });


    }

    // 处理数据-需要显示的数据
    function handleBoxList(items, time) {
        var arrOject = {
            danger: [],
            warning: [],
            normal: []
        };
        items.forEach(function(elem, index) {
            var className = 'normal';
            try {
                var dateTime = new Date(elem.dateTime);
                if (dateTime.toString() === "Invalid Date") {
                    throw new Error('invalid Date');
                }
                var dvalue = parseFloat(time) - dateTime.getTime(); //计算差值
                if (dvalue >= 5 * 60000) {
                    className = 'danger';
                } else if (dvalue >= 2.5 * 60000) {
                    className = 'warning';
                } else if (!elem.version || !elem.version.split(",")[0] || !elem.hostIp) {
                    className = 'danger';
                }
            } catch (e) {
                className = 'danger';
                console.log(e);
            }
            // 异常数组
            getTr(arrOject[className], className, elem, arrOject);
        });
        var rstArr = [];
        for (var k in arrOject) {
            if (arrOject.hasOwnProperty(k)) {
                rstArr = rstArr.concat(arrOject[k]);
            }
        }
        rstArr = rstArr.map(function(elem, index) {
            return elem.replace(/\${_index}/g, index + 1);
        });
        return rstArr.join();
    }

    // 点击事件-
    function getTr(conArr, type, elem) {
        conArr.push('<tr class="' + type + '"><td>${_index}</td><td class="td-company">' + (elem.company || "") + '</td><td><a href="javascript:void(0)" class="link-hostId" >' + (elem.id) + '</a></td><td>' + (elem.hostIp || "") + '</td><td>' + (elem.version) + '</td><td>' + (elem.dateTime) + '</td><td><a href="../box-water.html?hostId=' + (elem.id) + "&company=" + encodeURI(elem.company || "") + '" style="margin-right:20px;">盒子流水</a><a href="../user-water.html?hostId=' + elem.id + "&company=" + encodeURI(elem.company || "") + '" style="margin-right:20px;">用户流水</a><a style="margin-right:20px;" href="../box-user.html?hostId=' + elem.id + "&company=" + encodeURI(elem.company || "") + '">用户列表</a><a  href="../days-list.html?hostId=' + elem.id + '&company=' + encodeURI(elem.company || "") + '" style="margin-right:20px;">考勤记录</a></td></tr>');
    }

    // 点击事件-搜索
    function findBoxList(param) {
        $.ajax({
            url: '/api/findBoxList.json',
            method: 'get',
            data: param,
            dataType: 'json'
        }).done(function(response) {
            if (response.success) {
                var items = response.items,
                    time = response.time,
                    trhtml = handleBoxList(items, time);
                $("#boxListBody").html(trhtml);
            } else {
                alert(response.message);
            }
        });
    }

    // 点击确定按钮
    $("#btnSure").click(function() {
        var company = $("#company").val().trim(),
            id = $(this).attr('diy-hostId');
        if (!id || !company) {
            alert('id或者名字不能为空!');
            return;
        }
        updateBoxCompanyName({ company: company, id: id }, function(err, data) {
            $("#myModal").modal('hide');
            if (err) {
                alert(err);
            } else {
                findBoxAll();
            }
        })
    });

    $("#myModal").on('shown.bs.modal', function() {
        $("#company").focus();
    });



    $("#btnSearch").click(function() {
        var type = $('#dateType').val();
        var activeNum = $('#activeNum').val() || 0;
        findBoxList({ type: type, num: activeNum });
        // console.log(type, activeNum);
    });

    // 点击日周月
    $("#dateType").on('click', '.dateTypeItem', function() {
        $(this).addClass('disabled').siblings().removeClass('disabled');
    });

    $(document).on('click', '.link-hostId', function(e) {
        var tdCompnay = $(this).parent().siblings('.td-company');
        var hostId = $(this).html(),
            compnay = tdCompnay.html();
        hostIdClick(hostId, compnay);
    });

    findBoxAll();
});

function hostIdClick(hostId, name) {
    $("#btnSure").attr('diy-hostId', hostId);
    $("#company").val(name);
    $("#myModal").modal('show');
}

// 更新公司的名字
function updateBoxCompanyName(param, callback) {
    $.ajax({
            url: '/api/updateBoxCompanyName.json',
            method: 'post',
            dataType: 'json',
            data: param
        })
        .done(function(response) {
            if (response.success) {
                typeof callback === "function" && callback(null, response);
            } else {
                typeof callback === "function" && callback(response.message);
            }
        });
}