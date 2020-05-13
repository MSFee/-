// 跟完成试卷相关接口
const allServices = require('./index')

let complatePaperSql = {
  // 插入一条记录
  addRecord: function (parmas) {
    let _sql = `insert into complatePaper_info (paperId, studentId, complateTime, score) values
        (
            ${parmas.paperId},
            ${parmas.studentId},
            '${parmas.complateTime}',
            ${parmas.score}
        )`
    return allServices.query(_sql)
  },
  // 根据学生ID和试卷ID查询
  queryPaperList: function (studentId, paperId) {
    let _sql = `select * from complatePaper_info where studentId = ${studentId} and paperId = ${paperId}`
    return allServices.query(_sql)
  },
  // 查询某一张试卷的最高分
  queryMaxScore: function (paperId) {
    let _sql = `select max(score) as maxScore from complatePaper_info where paperId = ${paperId}`
    return allServices.query(_sql)
  },
  // 查询某一张试卷是否有人完成
  queryPaperHaveCompalte: function (paperId) {
    let _sql = `select studentId from complatePaper_info where paperId = ${paperId}`
    return allServices.query(_sql)
  },
  // 根据学号查询出所有已经完成的试卷
  querPaperComplate: function (studentId, page, size) {
    let _sql = `select complateTime, paperId, score from complatePaper_info where studentId = ${studentId}`
    _sql += ` limit ${(page - 1) * size} , ${size}`
    return allServices.query(_sql)
  },
  // 统计所有的数量
  querPaperComplateTotal: function (studentId) {
    let _sql = `select count(*) as total from complatePaper_info where studentId = ${studentId}`
    return allServices.query(_sql)
  },
  // 根据试卷ID查询出所有已完成学生的分数
  queryAllStudentScore: function (paperId) {
    let _sql = `select score from complatePaper_info where paperId = ${paperId} order by score desc`
    return allServices.query(_sql)
  },
  // 根据试卷ID查询出所有已完成学生的信息
  queryAllStudentInfo: function (paperId) {
    let _sql = `select score, complateTime, studentId from complatePaper_info where paperId = ${paperId} order by score desc limit 0,10`
    return allServices.query(_sql)
  }
}

module.exports = complatePaperSql
