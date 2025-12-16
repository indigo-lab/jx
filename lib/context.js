function dig(context, src) {
  if (Array.isArray(src)) return src.map((e) => dig(context, e));
  if (typeof src === "object") {
    const dst = {};
    for (const [k, v] of Object.entries(src)) {
      if (k === "@context") {
        const w = (Array.isArray(v) ? v : [v])
          .map((e) => {
            if (typeof e === "string") {
              context.str.add(e);
              return null;
            } else if (typeof e === "object") {
              const a = {};
              for (const [ns, url] of Object.entries(e)) {
                if (context.obj[ns] === undefined || context.obj[ns] === url) {
                  context.obj[ns] = url;
                } else {
                  a[ns] = url;
                }
              }
              return Object.keys(a).length === 0 ? null : a;
            }
          })
          .filter((a) => a !== null);
        if (w.length > 0) {
          dst[k] = w.length === 1 ? w[0] : w;
        }
      } else if (typeof v === "object") dst[k] = dig(context, v);
      else dst[k] = v;
    }
    return dst;
  }
}

function normalize(c) {
  const w = Array.from(c.str);
  if (Object.keys(c.obj).length > 0) w.push(c.obj);
  switch (w.length) {
    case 1:
      return w[0];
    case 0:
      return undefined;
    default:
      return w;
  }
}

module.exports = function (src) {
  if (Array.isArray(src)) {
    const context = { str: new Set(), obj: {} };
    const dst = dig(context, src);
    return { "@context": normalize(context), "@graph": dst };
  }
  if (typeof src === "object" && src["@context"]) {
    const context = { str: new Set(), obj: {} };
    const dst = dig(context, src);
    const res = { "@context": normalize(context) };
    for (const [k, v] of Object.entries(dst)) res[k] = v;
    return res;
  }
  return src;
};
