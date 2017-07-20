let schedule = require('node-schedule');

function initTask(func, delta = 5) {
    this.func = func;
    this.delta = delta;
    this.rule = this._init(this.delta);
}

initTask.prototype.run = function() {
    schedule.scheduleJob(this.rule, () => {
        this.func();
    })
}
initTask.prototype._init = function(delta) {
    let arr = [],
        count = 0,
        rule = new schedule.RecurrenceRule();
    while (count <= 60) {
        if (count % delta === 0) {
            arr.push(count);
        }
        count++;
    }
    rule.minute = arr;
    return rule;
}

module.exports = initTask;