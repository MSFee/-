const jwt = require('jsonwebtoken');
const serect = 'token';  //密钥，不能丢
module.exports = (params, status) => { //创建token并导出
  let token = null; 
  if(status == 0) {
    token = jwt.sign({ 
      uniqueIdentifier: params.studentId,
      status,
    }, serect, {expiresIn: '1h'});
  }else {
    token = jwt.sign({ 
      uniqueIdentifier: params.workNumber,
      status,
    }, serect, {expiresIn: '1h'});
  }

  return token;
};
