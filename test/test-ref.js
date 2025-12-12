const test = require("tape");
const jx = require("../jx.js");
const fs = require("fs");

const def = {
  "self reference": {
    input: {
      name: "Alice",
      age: 30,
      children: [
        {
          name: "Bob",
          age: 5,
        },
        {
          name: "Carol",
          age: 3,
        },
        {
          name: "Dave",
          age: 1,
        },
      ],
    },
    expected: {
      type: "Person",
      name: "Alice",
      age: 30,
      children: [
        {
          type: "Person",
          name: "Bob",
          age: 5,
        },
        {
          type: "Person",

          name: "Carol",
          age: 3,
        },
        {
          type: "Person",
          name: "Dave",
          age: 1,
        },
      ],
    },
  },
  "external reference": {
    input: { name: "John", address: { postalCode: "999-9999", label: "Somewhere" } },
    expected: {
      type: "Person",
      name: "John",
      address: { type: "Address", postalCode: "999-9999", label: "Somewhere" },
    },
  },
};

test("test jx ref", function (t) {
  const base = `${__dirname}/ref`;
  const mapping = JSON.parse(fs.readFileSync(`${base}/Person.json`, "UTF-8"));

  for (const [key, val] of Object.entries(def)) {
    t.deepEqual(jx(mapping, val.input, base), val.expected, key);
  }

  t.end();
});
