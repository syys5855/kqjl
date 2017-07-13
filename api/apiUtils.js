var util = require('util');
/*
    {success:true,message:string,[items:[]][data]}
    {success:false,message:string,code}
 */
exports.JsonResponse = (result, data) => {
    var response = null;
    switch (result) {
        case "success":
            response = {
                    success: true,
                    message: (data && data.message) || 'ok'
                }
                // 如果是数组就是用items
            if (util.isArray(data)) {
                response.items = data;
            }
            // 其他类型使用data
            else {
                response.data = data;
            }
            // statements_1
            break;
        case "failure":
            var message = "";
            if (typeof data === "object") {
                message = data.message;
            } else {
                message = data;
            }
            response = {
                success: false,
                message,
                code: data.code || ""
            }
            break;
        default:
            // statements_def
            break;
    }
    return response;
}

exports.PageResponse = (target, total, pageSize) => {

}

// 用户流水事件的转译 
// 1:push_request,2:subscribe,3:subscribe_webacht,4:waiqin_checkin,5:bind_user,6:view,7:push_result
exports.userEvent = function(status) {
    status = status.toString();
    switch (status) {
        case "1":
            return {
                status,
                value: 'push_request',
                text: "推送请求"
            };
        case "2":
            return {
                status,
                value: 'subscribe',
                text: "订阅"
            }
        case "3":
            return {
                status,
                value: 'subscribe_webacht',
                text: "关注微信公众号"
            }
        case "4":
            return {
                status,
                value: 'waiqin_checkin',
                text: "外勤签到"
            }
        case "5":
            return {
                status,
                value: 'bind_user',
                text: "绑定用户"
            }
        case "6":
            return {
                status,
                value: 'view',
                text: "查看"
            }
        case "7":
            return {
                status,
                value: 'push_result',
                text: "推送结果"
            }
        default:
            return {
                status,
                text: "未定义的状态"
            }
    }
};
// 用户流水事件结果的转译 
exports.userEventResult = function(status) {
    status = status.toString();
    switch (status) {
        case "1":
            return {
                status,

                text: "成功"
            };
        case "-1":
            return {
                status,
                text: "失败"
            }
        default:
            return {
                status,
                text: "未定义的状态"
            }
    }
}

// 盒子流水事件的转译
// 1:check_update,2:set_update,3:pull_waiqin_data,4:report_ip
exports.boxEvent = function(status) {
    status = status.toString();
    switch (status) {
        case "1":
            return {
                status,
                value: 'check_update',
                text: "检查更新"
            };
        case "2":
            return {
                status,
                value: 'set_update',
                text: "设置更新"
            }
        case "3":
            return {
                status,
                value: "pull_waiqin_data",
                text: '获取外勤数据'
            }
        case "4":
            return {
                status,
                value: "report_ip",
                text: '上报ip'
            }
        default:
            return {
                status,
                text: "未定义的状态"
            }
    }
}

exports.addZero = function(num) {
    return num < 10 ? '0' + num : num + '';
}

exports.toDateStr = function(date) {
    let addZero = function(num) {
        return num < 10 ? '0' + num : num + '';
    }
    return `${date.getFullYear()}/${addZero(date.getMonth()+1)}/${addZero(date.getDate())} ${addZero(date.getHours())}:${addZero(date.getMinutes())}:${addZero(date.getSeconds())}`;
}