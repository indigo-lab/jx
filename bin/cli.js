#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const jx = require("../jx.js");

if (process.argv.find((x) => x.endsWith("cli.js")) && process.argv.length !== 4) {
  console.error("usage: node cli.js [path_to_mapping.json] [path_to_data.json]");
  process.exit(1);
}

if (process.argv.length !== 4) {
  console.error("usage: jx [path_to_mapping.json] [path_to_data.json]");
  process.exit(1);
}

const base = path.dirname(path.resolve(process.argv[2]));
const template = JSON.parse(fs.readFileSync(process.argv[2], "UTF-8"));
const src = JSON.parse(fs.readFileSync(process.argv[3], "UTF-8"));

console.log(JSON.stringify(jx(template, src, { base: base, jsonld: true }), null, 2));
