// 跟完成题目相关接口
const allServices = require('./index')

let complateTitleSql = {
    // 插入一条记录
    insertRecords: function() {
        let _sql = `insert into completeTitle_info (
            titleId, studentId, complateTime, 
            isRight, submitAnswer)`
    }
}
module.exports = complateTitleSql
