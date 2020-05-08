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
    },
    // 根据试卷ID查询属于该试卷下的所有题目
    queryAllTitleByPaperId: function(paperId){
        let _sql = `select titleId, titleName, answer, createTime, count, maxScore from title_info where paperId = ${paperId}`;
        return allServices.query(_sql);
    },
    // 根据题目ID查询题目信息
    queryInfoById: function(titleId) {
        let _sql = `select * from title_info where titleId = ${titleId};`;
        return allServices.query(_sql);
    }
}
module.exports = titleSql;