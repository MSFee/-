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
        let _sql = `select titleId, titleName, answer, createTime, count, maxScore from title_info where paperId = ${paperId} order by titleId desc`;
        return allServices.query(_sql);
    },
    // 根据题目ID查询题目信息
    queryInfoById: function(titleId) {
        let _sql = `select * from title_info where titleId = ${titleId};`;
        return allServices.query(_sql);
    },
    // 根据题目ID查询题目部分
    queryInfoDetailById: function(titleId) {
        let _sql = `select titleId, titleName, paperId from title_info where titleId = ${titleId};`;
        return allServices.query(_sql);
    },
     // 删除题目
     deleteTitle: function(titleId) {
         let _sql = `delete from title_info where titleId = ${titleId}`;
         return allServices.query(_sql);
     },
     // 修改题目信息
     changeTitleInfo: function(parmas) {
        let _sql = `update title_info set titleName = '${parmas.titleName}', answer = '${parmas.answer}' where titleId = ${parmas.titleId};`;
        return allServices.query(_sql);
     },
     // 根据ID查询属于该试卷的题目数量
     queryTitalTotal: function(paperId) {
        let _sql = `select count(*) from title_info where paperId = ${paperId}`
        return allServices.query(_sql);
     },
}
module.exports = titleSql;