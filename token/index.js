const jwt = require('jsonwebtoken');
const serect = 'token';  //密钥，不能丢
module.exports = (userinfo) => { //创建token并导出
  const token = jwt.sign({
    workNumber: userinfo.workNumber,
    departmentId: userinfo.departmentId,
    permission: userinfo.permissions
  }, serect, {expiresIn: '1h'});
  return token;
};
