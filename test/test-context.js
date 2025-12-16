const test = require("tape");
const context = require("../lib/context.js");
test("test context", function (t) {
  t.deepEqual(context({}), {}, "@context が存在しない");

  t.deepEqual(
    context({ "@context": "http://schema.org/", "@type": "Person" }),
    {
      "@context": "http://schema.org/",
      "@type": "Person",
    },
    "@context が String"
  );

  t.deepEqual(
    context({ "@context": ["http://schema.org/", "http://example.org/"], "@type": "Person" }),
    {
      "@context": ["http://schema.org/", "http://example.org/"],
      "@type": "Person",
    },
    "@context が Array of String"
  );

  t.deepEqual(
    context({ "@context": { Person: "http://schema.org/Person" }, "@type": "Person" }),
    {
      "@context": { Person: "http://schema.org/Person" },
      "@type": "Person",
    },
    "@context が Object"
  );

  t.deepEqual(
    context({
      "@context": ["http://schema.org/", { Person: "http://schema.org/Person" }],
      "@type": "Person",
    }),
    {
      "@context": ["http://schema.org/", { Person: "http://schema.org/Person" }],
      "@type": "Person",
    },
    "@context が String と Object の Array"
  );

  t.deepEqual(
    context({
      "@context": "http://schema.org/",
      "@type": "Person",
      knows: {
        "@context": { foaf: "http://xmlns.com/foaf/0.1/" },
        "@type": "foaf:Person",
      },
    }),
    {
      "@context": ["http://schema.org/", { foaf: "http://xmlns.com/foaf/0.1/" }],
      "@type": "Person",
      knows: {
        "@type": "foaf:Person",
      },
    },
    "下位の Context を上位に集約"
  );

  t.deepEqual(
    context({
      "@context": { ex: "http://example.org/ex1/" },
      "@type": "ex:Person",
      "ex:knows": {
        "@context": { ex: "http://example.org/ex2/" },
        "@type": "ex:Person",
      },
    }),
    {
      "@context": { ex: "http://example.org/ex1/" },
      "@type": "ex:Person",
      "ex:knows": {
        "@context": { ex: "http://example.org/ex2/" },
        "@type": "ex:Person",
      },
    },
    "下位の Context でのコンフリクトは @context を維持"
  );

  t.deepEqual(
    context({
      "@context": { ex: "http://example.org/ex1/" },
      "@type": "ex:Person",
      "ex:knows": {
        "@context": { ex: "http://example.org/ex2/", foaf: "http://xmlns.com/foaf/0.1/" },
        "@type": "ex:Person",
      },
    }),
    {
      "@context": { ex: "http://example.org/ex1/", foaf: "http://xmlns.com/foaf/0.1/" },
      "@type": "ex:Person",
      "ex:knows": {
        "@context": { ex: "http://example.org/ex2/" },
        "@type": "ex:Person",
      },
    },
    "下位の Context での集約とコンフリクト"
  );

  t.deepEqual(
    context({
      "@context": { ex: "http://example.org/ex1/" },
      "@type": "ex:Person",
      "ex:knows": [
        {
          "@context": { ex: "http://example.org/ex2/", foaf: "http://xmlns.com/foaf/0.1/" },
          "@type": "ex:Person",
        },
        {
          "@context": { foaf: "http://xmlns.com/foaf/0.1/" },
          "@type": "ex:Person",
        },
      ],
    }),
    {
      "@context": { ex: "http://example.org/ex1/", foaf: "http://xmlns.com/foaf/0.1/" },
      "@type": "ex:Person",
      "ex:knows": [
        {
          "@context": { ex: "http://example.org/ex2/" },
          "@type": "ex:Person",
        },
        {
          "@type": "ex:Person",
        },
      ],
    },
    "下位のコンテクストでの集約(応用)"
  );

  t.end();
});
