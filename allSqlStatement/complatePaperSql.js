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
    }
}

module.exports = complatePaperSql