// 跟完成题目相关接口
const allServices = require('./index')

let complateTitleSql = {
  // 插入一条记录
  addRecord: function (params) {
    let _sql = `insert into completeTitle_info (
            titleId, studentId, complateTime, 
            isRight, submitAnswer, trueAnswer, paperId, score) values (
                ${params.titleId},
                ${params.studentId},
                '${params.complateTime}',
                ${params.isRight},
                '${params.answer}',
                '${params.trueAnswer}',
                ${params.paperId},
                ${params.score}
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
      isRight = ${params.isRight}, submitAnswer = '${params.answer}', 
      complateTime = '${params.complateTime}', score = ${params.score}
      where titleId = ${params.titleId} and studentId = ${params.studentId}`
      return allServices.query(_sql);
  },
  // 根据学号和题目Id查询题目是否已经完成
  getTitleStatus: function(studentId, titleId) {
    let _sql = `select isRight, submitAnswer from completeTitle_info where studentId = ${studentId} and titleId = ${titleId}`
    return allServices.query(_sql);
  },
  // 根据试卷ID查询和学号查询出某个学生已经该完成的题目
  getTitleListByPaperId: function(studentId, paperId) {
    let _sql = `select titleId from completeTitle_info where studentId = ${studentId} and paperId = ${paperId} order by titleId asc`
    return allServices.query(_sql)
  }
}
module.exports = complateTitleSql
