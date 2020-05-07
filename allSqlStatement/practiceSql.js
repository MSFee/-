// 题目联系相关接口
const allServices = require('./testSqlIndex')

let practiceSql = {
    // 执行学生提交的sql语句
    perform: function(sql) {
        return allServices.query(sql);
    }
}
module.exports = practiceSql;