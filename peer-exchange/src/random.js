const crypto = require('crypto');

const ID_LENGTH = 12;
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRandomString(len = 6, chars = URL_SAFE) {
  let cursor = 0;
  return crypto.randomBytes(len).reduce((string, byte) => {
    cursor += byte;
    return string + chars[cursor % chars.length];
  }, '');
}

function createId() {
    return generateRandomString(ID_LENGTH);
}

module.exports = {
    createId,
};
