module.exports = function(db) {
    // 定时任务设置在每月的28日执行,所以加上10天就一定是下个月的
    let nextMonth = new Date(Date.now + 10 * 24 * 3600 * 1000);
    let nextMonthDayStrList = getMonthDays(nextMonth);
    nextMonthDayStrList.forEach(nmd => {
        // 盒子流水表 event:{1:check_update,2:set_update} result:{1:check_udpate,2:set_update}
        db.run('CREATE TABLE IF NOT EXISTS box_water_' + nmd + '(id INTEGER PRIMARY KEY AUTOINCREMENT,hostId VARCHAR(32),hostIp VARCHAR(32),version VARCHAR(43),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32));', err => {
            callback(err);
        });
        // 用户流水表 event:{1:push_request,2:subscribe,3:subscribe_webacht} result:{1:push_success,2:unsubscribe}
        db.run('CREATE TABLE IF NOT EXISTS user_water_' + nmd + '(id INTEGER PRIMARY KEY AUTOINCREMENT,userId VARCHAR(32),openId VARCHAR(32),hostId VARCHAR(32),event VARCHAR(32),result VARCHAR(32),dateTime VARCHAR(32),createTime VARCHAR(32));', (err) => {
            callback(err);
        });
    })
}

function getMonthDays(date = new Date()) {
    // 生成年月日信息
    let month = date.getMonth(), //获去当前的月
        year = date.getFullYear(),
        days = [31, '', 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    (year % 4 == 0 && year % 100 != 0 || year % 400 == 0) ? days[1] = 29: days[1] = 28;

    let i = 1,
        arr = [], // 本月的日期列表
        y = year,
        m = (month + 1) < 10 ? '0' + (month + 1) : "" + (month + 1),
        ym = y + m;
    while (i <= days[month]) {
        let d = i < 10 ? '0' + i : i;
        arr.push(ym + d);
        i++;
    }
    return arr;
}