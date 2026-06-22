const jsonpointer = require("jsonpointer");

function $array(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj === undefined || obj === null) return [];
  return [obj];
}

function isStatic(a) {
  if (Array.isArray(a)) return a.find((b) => !isStatic(b)) === undefined;
  if (typeof a === "string") return a !== "." && !a.startsWith("/") && a.match(/^.*{\/.*}.*$/);
  for (const [k, v] of Object.entries(a)) if (k.includes("/") || !isStatic(v)) return false;
  return true;
}

function resolve(context, pointer) {
  const tokens = pointer.split("[");
  const head = tokens.shift();
  const filters = tokens.filter((a) => a.endsWith("]")).map((a) => a.replace(/\]$/, ""));

  let res = $array(head === "/" ? context : jsonpointer.get(context, head));
  for (const filter of filters) {
    let re;
    if ((re = filter.match(/^(!)?([^!=<>]+)$/))) {
      res = res.filter((a) => {
        if (jsonpointer.get(a, `/${re[2]}`) === undefined) return re[1] === "!";
        return re[1] !== "!";
      });
    } else if ((re = filter.match(/([^!=<>]+)(=|!=|>|<|>=|<=)(.+)$/))) {
      const op = re[2];
      const right = JSON.parse(re[3].replace(/^'/, '"').replace(/'$/, '"'));
      res = res.filter((a) => {
        const left = jsonpointer.get(a, `/${re[1]}`);
        if (left === undefined) return false;
        if (typeof left !== typeof right) return false;
        if (op === "=") return left === right;
        if (op === "!=") return left !== right;
        if (op === ">") return left > right;
        if (op === "<") return left < right;
        if (op === ">=") return left >= right;
        if (op === "<=") return left <= right;
        return false;
      });
    } else {
      console.error("broken filter", filter);
      res = [];
    }
  }
  return res;
}

function dig(template, context) {
  if (typeof template === "string") {
    if (template === ".") {
      return { body: context, good: 1, fail: 0 };
    } else if (template.startsWith("/")) {
      const a = jsonpointer.get(context, template);
      const b = a !== undefined;
      return { body: a, good: b ? 1 : 0, fail: b ? 0 : 1 };
    } else if (template.match(/^.*{\/.*}.*$/)) {
      const res = { body: "", good: 0, fail: 0 };
      let start = 0;
      while (start < template.length) {
        const a = template.indexOf("{/", start);
        if (a === -1) {
          res.body += template.substring(start);
          start = template.length + 1;
          continue;
        }
        const b = template.indexOf("}", a);
        if (start < a) res.body += template.substring(start, a);
        const pointer = template.substring(a + 1, b);
        const v = pointer === "/" ? context : jsonpointer.get(context, pointer);
        if (v === undefined) res.fail++;
        else {
          res.good++;
          res.body += v;
        }
        start = b + 1;
      }
      return res;
    } else {
      return { body: template, good: 0, fail: 0 };
    }
  }

  const body = {};
  let good = 0;
  let fail = 0;

  for (const [key, val] of Object.entries(template)) {
    const property = key.split("/")[0];

    const contexts = key.includes("/")
      ? resolve(context, key.substring(key.indexOf("/")))
      : $array(context);

    for (const ctx of contexts) {
      for (const tmpl of $array(val)) {
        const done = dig(tmpl, ctx);
        good += done.good;
        fail += done.fail;

        if (done.body === undefined) continue;
        if (done.fail > 0 && done.good === 0) continue;

        if (body[property] === undefined) body[property] = done.body;
        else if (Array.isArray(body[property])) body[property].push(done.body);
        else body[property] = [body[property], done.body];
      }
    }
  }

  return { body, good, fail };
}

module.exports = function (template, context) {
  const res = dig(template, context);
  return res.good === 0 && res.fail > 0 ? null : res.body;
};
