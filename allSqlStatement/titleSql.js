// 跟题目相关接口
const allServices = require('./index')

let titleSql = {
    // 新增一道题目
    addtitle: function(parmas) {
        let _sql = `insert into title_info (titleName, answer, paperId, count, createTime)
        Values (
            '${parmas.titleName}',
            '${parmas.answer}',
            ${parmas.paperId},
            0,
            '${parmas.createTime}'
        )
        `;
        return allServices.query(_sql);
    }
}
module.exports = titleSql;