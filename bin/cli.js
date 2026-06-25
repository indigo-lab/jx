#!/usr/bin/env node

const fs = require("fs");
const jx = require("../jx.js");

if (process.argv.length !== 4) {
  console.error("usage: jx [path_to_template.json] [path_to_data.json]");
  process.exit(1);
}

try {
  const template = JSON.parse(fs.readFileSync(process.argv[2], "UTF-8"));
  const source = JSON.parse(fs.readFileSync(process.argv[3], "UTF-8"));
  const json = jx(template, source);
  console.log(JSON.stringify(json, null, 2));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
