// 题目练习相关接口
const allServices = require('./studentSqlTest')

let practiceSql = {
    // 执行学生提交的sql语句
    perform: function(sql) {
        return allServices.query(sql);
    },
    // 创建临时表
    createTemTable: function(tableName, oldTableName) {
        let _sql = `CREATE TEMPORARY TABLE ${tableName} SELECT * FROM ${oldTableName};`
        return allServices.query(_sql);
    },
    // 查询随即表数据
    queryDataTemTable: function(tableName) {
        let _sql = `select * from ${tableName}`;
        console.log(_sql)
        return allServices.query(_sql);
    },
    // 删除临时表
    deleteTemTable: function(tableName) {
        let _sql = `drop table ${tableName};`;
        return allServices.query(_sql);
    }
}
module.exports = practiceSql;