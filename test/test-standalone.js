const test = require("tape");
const jx = require("../jx.js");
const fs = require("fs");

test("test jx standalone", function (t) {
  for (const name of fs.readdirSync(`${__dirname}/standalone`)) {
    const { title, mapping, input, expected } = JSON.parse(
      fs.readFileSync(`${__dirname}/standalone/${name}`, "UTF-8")
    );
    t.deepEqual(jx(mapping, input), expected, title);
  }
  t.end();
});
