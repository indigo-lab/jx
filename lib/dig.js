const jsonpointer = require("jsonpointer");
const propertyNameExtension = require("./property-name-extension.js");
const propertyValueExtension = require("./property-value-extension.js");

function _asArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj === undefined || obj === null) return [];
  return [obj];
}

function query(pointer, root, current) {
  if (pointer === ".") return current;
  if (pointer === "/") return root;
  if (pointer.startsWith("/")) return jsonpointer.get(root, pointer);
  return jsonpointer.get(current, `/${pointer}`);
}

function processName(name, root, current) {
  const e = propertyNameExtension.parse(name);
  e.contexts = _asArray(query(e.pointer, root, current));

  const operations = {
    Exist: (a) => a !== undefined,
    NotExist: (a) => a === undefined,
    "=": (a, b) => a === b,
    "!=": (a, b) => a !== b,
    ">": (a, b) => a > b,
    "<": (a, b) => a < b,
    ">=": (a, b) => a >= b,
    "<=": (a, b) => a <= b,
  };

  for (const { pointer, op, value } of e.filter)
    e.contexts = e.contexts.filter((context) => {
      return operations[op](query(pointer, root, context), value);
    });

  return e;
}

function processValue(value, root, current) {
  if (typeof value !== "string") return { body: value, good: 0, fail: 0 };

  const e = propertyValueExtension.parse(value);
  if (!Array.isArray(e)) {
    const v = query(e.pointer, root, current);
    if (v === undefined) return { body: null, good: 0, fail: 1 };
    return { body: v, good: 1, fail: 0 };
  }
  let good = 0;
  let fail = 0;
  const body = e.map((a) => {
    if (a.pointer === undefined) return a;
    const target = query(a.pointer, root, current);
    if (target === undefined) {
      fail++;
      return "";
    }
    good++;
    return target;
  });
  return { body: body.join(""), good, fail };
}

function dig(template, root, current) {
  const body = {};
  let good = 0;
  let fail = 0;

  for (const [name, value] of Object.entries(template)) {
    const { contexts, property } = processName(name, root, current);
    for (const ctx of contexts) {
      for (const val of _asArray(value)) {
        const done = typeof val === "object" ? dig(val, root, ctx) : processValue(val, root, ctx);
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

module.exports = dig;
