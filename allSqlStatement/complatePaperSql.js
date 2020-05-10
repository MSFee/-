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
    }
}

module.exports = complatePaperSql