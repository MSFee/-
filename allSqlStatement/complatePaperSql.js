// 跟完成试卷相关接口
const allServices = require('./index')

let complatePaperSql = {
    // 插入一条记录
    addRecord: function(parmas) {
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
    queryPaperList: function(studentId, paperId) {
        let _sql = `select * from complatePaper_info where studentId = ${studentId} and paperId = ${paperId}`
        return allServices.query(_sql)
    },
    // 查询某一张试卷的最高分
    queryMaxScore: function(paperId) {
        let _sql = `select max(score) as maxScore from complatePaper_info where paperId = ${paperId}`
        return allServices.query(_sql)
    },
    // 查询某一张试卷是否有人完成
    queryPaperHaveCompalte: function(paperId) {
        let _sql = `select studentId from complatePaper_info where paperId = ${paperId}`
        return allServices.query(_sql)
    }
}

module.exports = complatePaperSql