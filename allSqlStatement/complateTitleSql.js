// 跟完成题目相关接口
const allServices = require('./index')

let complateTitleSql = {
  // 插入一条记录
  addRecord: function (params) {
    let _sql = `insert into completeTitle_info (
            titleId, studentId, complateTime, 
            isRight, submitAnswer, trueAnswer) values (
                ${params.titleId},
                ${params.studentId},
                '${params.complateTime}',
                ${params.isRight},
                '${params.answer}',
                '${params.trueAnswer}'
            )`
    return allServices.query(_sql)
  },
  // 查询是否存在错题记录
  queryScordByID: function(titleId, studentId) {
      let _sql = `select id from completeTitle_info where titleId = ${titleId} and studentId = ${studentId}`
      return allServices.query(_sql)
  },
  // 修改错题
  changeTitleRecord: function(params) {
      let _sql = `update completeTitle_info set 
      isRight = ${params.isRight}, submitAnswer = '${params.answer}', complateTime = '${params.complateTime}'
      where titleId = ${params.titleId} and studentId = ${params.studentId}`
      return allServices.query(_sql);
  }
}
module.exports = complateTitleSql
