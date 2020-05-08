// 跟试卷相关接口
const allServices = require('./index')

let parperSql = {
    // 新增一张试卷
    addPaper: function(parmas) {
        let _sql = `insert into paper_info (paperName,createTime,workNumber, count, issued)
        Values (
            '${parmas.paperName}',
            '${parmas.createTime}',
            ${parmas.workNumber},
            0,
            0
        )
        `;
        return allServices.query(_sql);
    },
    // 根据试卷ID查询试卷信息
    queryPaperInfo: function(paperId) {
        let _sql = `select * from paper_info where paperId = ${paperId}`
        return allServices.query(_sql);
    },
    // 查询所有的试卷
    queryAllPaperList: function() {
        let _sql = `select * from paper_info`;
        return allServices.query(_sql);
    },
    // 老师查询自己所创建的试卷
    queryMyPaperList: function(workNumber) {
        let _sql = `select * from paper_info where workNumber = ${workNumber};`;
        return allServices.query(_sql);
    }
}
module.exports = parperSql;