const jsonpointer = require("jsonpointer");
const fs = require("fs");
const path = require("path");

module.exports = function (template, src, base) {
  const isStatic = function (a) {
    if (Array.isArray(a)) return a.find((b) => !isStatic(b)) === undefined;
    if (typeof a === "string") return a !== "." && !a.startsWith("/");
    for (const [k, v] of Object.entries(a)) {
      if (k.includes("/")) return false;
      if (k === "$ref") return false;
      if (!isStatic(v)) return false;
    }
    return true;
  };

  const dig = function (template, src) {
    if (typeof template === "string") {
      if (template === ".") return { modified: true, body: src };
      if (template.startsWith("/")) {
        const x = jsonpointer.get(src, template);
        return { modified: x !== undefined, body: x };
      }
      return { modified: false, body: template };
    }

    const res = {
      modified: false,
      body: {},
    };

    for (const [key, val] of Object.entries(template)) {
      let k = key;
      let s = src;
      let i = key.indexOf("/");
      if (i !== -1) {
        k = key.substring(0, i);
        s = jsonpointer.get(src, key.substring(i));
        if (s === undefined) continue;
      }

      let def = val;
      if (val["$ref"] !== undefined) {
        const a = path.resolve(base, val["$ref"]);
        def = JSON.parse(fs.readFileSync(a, "UTF-8"));
        for (const k of Object.keys(val).filter((x) => x !== "$ref")) def[k] = val[k];
      }

      for (const d of Array.isArray(def) ? def : [def]) {
        for (const e of Array.isArray(s) ? s : [s]) {
          const x = dig(d, e);
          if (x.body === undefined) continue;
          if (i !== -1 && x.modified === false) continue;
          if (Array.isArray(def) && x.modified === false) continue;
          if (!isStatic(d) && x.modified === false) continue;

          if (res.body[k] === undefined) res.body[k] = x.body;
          else if (Array.isArray(res.body[k])) res.body[k].push(x.body);
          else res.body[k] = [res.body[k], x.body];
          if (x.modified) res.modified = true;
        }
      }
    }

    return res;
  };

  if (Array.isArray(src)) {
    const answer = [];
    for (const e of src) {
      const res = dig(template, e);
      if (res.modified) answer.push(res.body);
    }
    return answer;
  } else {
    const res = dig(template, src);
    return res.modified ? res.body : null;
  }
};
