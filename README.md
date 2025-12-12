# @indigo-lab/jx

JX is a JSON mapping spec and a set of tools for minimalists.

## Example

このようなアドホックな JSON を

```json
{ "name": "Alice", "son": ["Bob", "Dave"], "daughter": "Carol" }
```

次のような FOAF ベースの JSON-LD に変換したいものとします。

```json
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/"
  },
  "@type": "Person",
  "name": "Alice",
  "knows": [
    {
      "@type": "Person",
      "name": "Bob"
    },
    {
      "@type": "Person",
      "name": "Dave"
    },
    {
      "@type": "Person",
      "name": "Carol"
    }
  ]
}
```

jx では以下のような JSON マッピングを記述することで上記の変換を可能にします。

```json
{
  "@context": { "@vocab": "http://xmlns.com/foaf/0.1/" },
  "@type": "Person",
  "name": "/name",
  "knows/son": {
    "@type": "Person",
    "name": "."
  },
  "knows/daughter": {
    "@type": "Person",
    "name": "."
  }
}
```

### Feature1: Context

jx マッピングではコンテクストの概念があります。
デフォルトのコンテクストは入力 JSON のルートオブジェクトです。

JSON Object のプロパティ名に `"knows/son"` のようにスラッシュが含まれる場合、
スラッシュ以降は JSON Pointer として解釈されます。

現在のコンテクストを起点に `/son` が解決されます。

このとき、`/son` によって解決されたものが JSON Array だった場合には、
JSON Array の各要素がイテレートされ、それぞれをコンテクストとして下部要素が処理されます。

それ以外の場合には、単に解決されたものをコンテクストとして下部要素が処理されます。

### Feature2: JSON Pointer

JSON マッピングの中に登場するスラッシュで始まる JSON String (たとえば `"/name"`) は
現在のコンテクストを起点とする JSON Pointer として解釈され、
解決された値で置換されます。

### Feature3: Copy

JSON マッピングの中に登場する JSON String が `"."` である場合は、
現在のコンテクストによって置換されます。

### Feature4: ref

**To be added**
