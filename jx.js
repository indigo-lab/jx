const dig = require("./lib/dig.js");
module.exports = function (template, source) {
  const res = dig(template, source, source);
  return res.good === 0 && res.fail > 0 ? null : res.body;
};
