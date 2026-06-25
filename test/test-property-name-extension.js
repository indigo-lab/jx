const test = require("tape");
const { parse } = require("../lib/property-name-extension.js");

test("test property-name-extension", function (t) {
  // property name
  t.deepEqual(parse("name"), { property: "name", pointer: ".", filter: [] });
  t.deepEqual(parse("foaf:name"), { property: "foaf:name", pointer: ".", filter: [] });

  // property name and pointer
  t.deepEqual(parse("name{/}"), { property: "name", pointer: "/", filter: [] });
  t.deepEqual(parse("name{.}"), { property: "name", pointer: ".", filter: [] });
  t.deepEqual(parse("name{children}"), { property: "name", pointer: "children", filter: [] });
  t.deepEqual(parse("name{/children}"), { property: "name", pointer: "/children", filter: [] });
  t.deepEqual(parse("name{path/to/children}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [],
  });
  t.deepEqual(parse("name{/path/to/children}"), {
    property: "name",
    pointer: "/path/to/children",
    filter: [],
  });

  // property name and pointer and single filter
  t.deepEqual(parse("name{path/to/children[age]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "Exist" }],
  });
  t.deepEqual(parse("name{path/to/children[!age]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "NotExist" }],
  });
  t.deepEqual(parse("name{path/to/children[age=10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "=", value: 10 }],
  });
  t.deepEqual(parse("name{path/to/children[age!=10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "!=", value: 10 }],
  });
  t.deepEqual(parse("name{path/to/children[age>10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: ">", value: 10 }],
  });
  t.deepEqual(parse("name{path/to/children[age<10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "<", value: 10 }],
  });
  t.deepEqual(parse("name{path/to/children[age>=10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: ">=", value: 10 }],
  });
  t.deepEqual(parse("name{path/to/children[age<=10]}"), {
    property: "name",
    pointer: "path/to/children",
    filter: [{ pointer: "age", op: "<=", value: 10 }],
  });

  // property name and pointer and multi filters
  t.deepEqual(parse("teen{path/to/children[age>=13][age<=19]}"), {
    property: "teen",
    pointer: "path/to/children",
    filter: [
      { pointer: "age", op: ">=", value: 13 },
      { pointer: "age", op: "<=", value: 19 },
    ],
  });

  // Syntax error
  t.throws(() => parse("teen{children[age>true]}"));
  t.throws(() => parse("teen{children[age>null]}"));
  t.throws(() => parse("teen{children[age<true]}"));
  t.throws(() => parse("teen{children[age<null]}"));
  t.throws(() => parse("teen{children[age<=true]}"));
  t.throws(() => parse("teen{children[age<=null]}"));
  t.throws(() => parse("teen{children[age>=true]}"));
  t.throws(() => parse("teen{children[age>=null]}"));
  t.end();
});
