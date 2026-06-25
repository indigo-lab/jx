const test = require("tape");
const { parse } = require("../lib/property-value-extension.js");

test("test property-value-extension", function (t) {
  // SingleBlock
  t.deepEqual(parse("{.}"), { pointer: "." });
  t.deepEqual(parse("{/}"), { pointer: "/" });
  t.deepEqual(parse("{age}"), { pointer: "age" });
  t.deepEqual(parse("{/age}"), { pointer: "/age" });

  // AttributeValueTemplate n=0
  t.deepEqual(parse("hoge"), ["hoge"]);

  // AttributeValueTemplate n=1
  t.deepEqual(parse("hoge{.}"), ["hoge", { pointer: "." }]);
  t.deepEqual(parse("{.}hoge"), [{ pointer: "." }, "hoge"]);
  t.deepEqual(parse("hoge{.}puyo"), ["hoge", { pointer: "." }, "puyo"]);
  t.deepEqual(parse("hoge{/}"), ["hoge", { pointer: "/" }]);
  t.deepEqual(parse("{/}hoge"), [{ pointer: "/" }, "hoge"]);
  t.deepEqual(parse("hoge{/}puyo"), ["hoge", { pointer: "/" }, "puyo"]);
  t.deepEqual(parse("hoge{age}"), ["hoge", { pointer: "age" }]);
  t.deepEqual(parse("{age}hoge"), [{ pointer: "age" }, "hoge"]);
  t.deepEqual(parse("hoge{age}puyo"), ["hoge", { pointer: "age" }, "puyo"]);
  t.deepEqual(parse("hoge{/age}"), ["hoge", { pointer: "/age" }]);
  t.deepEqual(parse("{/age}hoge"), [{ pointer: "/age" }, "hoge"]);
  t.deepEqual(parse("hoge{/age}puyo"), ["hoge", { pointer: "/age" }, "puyo"]);

  // AttributeValueTemplate n=2
  t.deepEqual(parse("a{b}c{d}e"), ["a", { pointer: "b" }, "c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}c{d}"), ["a", { pointer: "b" }, "c", { pointer: "d" }]);
  t.deepEqual(parse("a{b}{d}e"), ["a", { pointer: "b" }, { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}{d}"), ["a", { pointer: "b" }, { pointer: "d" }]);
  t.deepEqual(parse("{b}c{d}e"), [{ pointer: "b" }, "c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("{b}c{d}"), [{ pointer: "b" }, "c", { pointer: "d" }]);
  t.deepEqual(parse("{b}{d}e"), [{ pointer: "b" }, { pointer: "d" }, "e"]);
  t.deepEqual(parse("{b}{d}"), [{ pointer: "b" }, { pointer: "d" }]);

  // Escaped brace
  t.deepEqual(parse("\\{a{b}c{d}e"), ["{a", { pointer: "b" }, "c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}\\{c{d}e"), ["a", { pointer: "b" }, "{c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}c{d}e\\{"), ["a", { pointer: "b" }, "c", { pointer: "d" }, "e{"]);
  t.deepEqual(parse("\\}a{b}c{d}e"), ["}a", { pointer: "b" }, "c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}\\}c{d}e"), ["a", { pointer: "b" }, "}c", { pointer: "d" }, "e"]);
  t.deepEqual(parse("a{b}c{d}e\\}"), ["a", { pointer: "b" }, "c", { pointer: "d" }, "e}"]);

  // Syntax error
  t.throws(() => parse("{}"));
  t.throws(() => parse("}"));
  t.throws(() => parse("{"));
  t.throws(() => parse("{."));
  t.throws(() => parse(".}"));
  t.throws(() => parse("{."));

  t.end();
});
