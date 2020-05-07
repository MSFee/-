const jwt = require('jsonwebtoken');
const serect = 'token';
module.exports = (tokens) => {
    if (tokens) {
        let token = tokens.split(' ')[1];
        let decoded = jwt.decode(token, serect);
        return decoded;
    }
}