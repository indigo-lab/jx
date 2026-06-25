# @indigo-lab/jx

JX は、ミニマリストのための JSON → JSON 変換仕様およびツールセットです。

## インストール

```bash
npm install @indigo-lab/jx
```

## CLI

```bash
jx <mapping.json> <data.json>
```

## API

```js
const jx = require("@indigo-lab/jx");

const result = jx(mapping, source);
// → 変換結果のオブジェクト、または null
```

---

## 例

次のようなアドホックな JSON を

```json
{ "name": "Alice", "son": ["Bob", "Dave"], "daughter": "Carol" }
```

FOAF ベースの JSON-LD に変換するマッピングは以下のように書けます。

```json
{
  "@context": { "@vocab": "http://xmlns.com/foaf/0.1/" },
  "@type": "Person",
  "name": "{name}",
  "knows{son}": {
    "@type": "Person",
    "name": "{.}"
  },
  "knows{daughter}": {
    "@type": "Person",
    "name": "{.}"
  }
}
```

出力:

```json
{
  "@context": { "@vocab": "http://xmlns.com/foaf/0.1/" },
  "@type": "Person",
  "name": "Alice",
  "knows": [
    { "@type": "Person", "name": "Bob" },
    { "@type": "Person", "name": "Dave" },
    { "@type": "Person", "name": "Carol" }
  ]
}
```

通常の JSON と異なる点は以下の 2 点です。

1. JSON String に含まれる `{~}` ブロックはソース JSON の値で置き換えられます
2. JSON Object のキーに `{~}` ブロックが含まれる場合、解決された値に対してイテレーションが行われます

---

## 仕様

### コンテキスト

jx 変換には **コンテキスト** という概念があります。
変換開始時のコンテキストはソース JSON のルートオブジェクトです。
キーの `{~}` ブロックによってコンテキストが切り替わりながら、テンプレートが再帰的に処理されます。

ポインタ式はいずれも次の 2 つの起点から解決されます。

| 起点     | 意味                                                   |
| -------- | ------------------------------------------------------ |
| **head** | ソース JSON のルート（変換中に変わらない）             |
| **tail** | 現在のコンテキスト（イテレーションのたびに切り替わる） |

---

### Feature 1: イテレーション（キーの `{~}` ブロック）

```
"<property>{<pointer>[<filter>]...}": <value-or-template>
```

キーに `{...}` ブロックを付けると、ポインタを解決してイテレーションを行います。

| ポインタ     | 解決元                         |
| ------------ | ------------------------------ |
| `{.}`        | tail 自身                      |
| `{/}`        | head（ルート）自身             |
| `{relKey}`   | tail の `relKey` プロパティ    |
| `{/absPath}` | head を起点とする JSON Pointer |

解決結果が配列のとき、各要素を順にコンテキストとして `<value-or-template>` を処理します。
解決結果が配列以外のとき、その値を単一のコンテキストとして処理します。

同じ `<property>` に複数の `{~}` キーが存在すると、結果は配列に集積されます（上記の例の `knows` を参照）。

#### フィルタ

ポインタの直後に `[condition]` を付けると、解決された配列をフィルタできます。
複数のフィルタを連結することも可能です。

```
"<property>{<pointer>[<cond1>][<cond2>]...}": ...
```

| フィルタ        | 意味                        |
| --------------- | --------------------------- |
| `[prop]`        | `prop` が存在する要素のみ   |
| `[!prop]`       | `prop` が存在しない要素のみ |
| `[prop=value]`  | `prop === value` の要素のみ |
| `[prop!=value]` | `prop !== value` の要素のみ |
| `[prop>value]`  | `prop > value` の要素のみ   |
| `[prop<value]`  | `prop < value` の要素のみ   |
| `[prop>=value]` | `prop >= value` の要素のみ  |
| `[prop<=value]` | `prop <= value` の要素のみ  |

`value` は JSON リテラル（数値・`true`/`false`・`null`・ダブルクォート文字列）、
またはシングルクォート文字列で記述します。

例:

```json
{
  "children": [
    { "name": "John", "gender": "M", "age": 13 },
    { "name": "Alice", "gender": "F", "age": 9 },
    { "name": "Bob" }
  ]
}
```

```json
{
  "son{children[gender='M']}": { "name": "{name}" },
  "daughter{children[gender='F']}": { "name": "{name}" },
  "teen{children[age>12]}": { "name": "{name}" },
  "unknown{children[!gender]}": { "name": "{name}" }
}
```

```json
{
  "son": { "name": "John" },
  "daughter": { "name": "Alice" },
  "teen": { "name": "John" },
  "unknown": { "name": "Bob" }
}
```

`{.}` をポインタに使うと tail 自身をフィルタ対象にできます。
これを使うと、コンテキストが条件を満たす場合だけプロパティを出力する、という条件付き出力が表現できます。

```json
{ "public": true, "name": "Alice" }
```

```json
{
  "name": "{name}",
  "accessRights{.[public=true]}": {
    "@id": "http://publications.europa.eu/resource/authority/access-right/PUBLIC"
  }
}
```

```json
{
  "name": "Alice",
  "accessRights": {
    "@id": "http://publications.europa.eu/resource/authority/access-right/PUBLIC"
  }
}
```

---

### Feature 2: 値の補間（値の `{~}` ブロック）

JSON String 値に含まれる `{...}` ブロックはポインタとして解決されます。

| 式           | 解決先                         |
| ------------ | ------------------------------ |
| `{.}`        | tail（現在のコンテキスト）     |
| `{/}`        | head（ルート）                 |
| `{relKey}`   | tail の `relKey` プロパティ    |
| `{/absPath}` | head を起点とする JSON Pointer |

**型保持**: ブロックが文字列全体を占める場合（`"{size}"` など）、
元の型（数値・真偽値・オブジェクト・配列）を保持したまま置換されます。

**文字列結合**: ブロックが文字列の一部にすぎない場合（`"Hello, {name}!"` など）、
すべてのセグメントを文字列として結合します。

`{/absPath}` を使うと、イテレーション中でも head（ルート）のプロパティを参照できます。

```json
{ "name": "data", "files": [{ "name": "README.md", "size": 2179 }] }
```

```json
{
  "@id": "https://example.org/{/name}",
  "distribution{/files}": {
    "@id": "https://example.org/{/name}/{name}",
    "size": "{size}"
  }
}
```

```json
{
  "@id": "https://example.org/data",
  "distribution": {
    "@id": "https://example.org/data/README.md",
    "size": 2179
  }
}
```

---

### Feature 3: トリミング

ポインタが解決できなかった場合（ソース JSON に該当キーが存在しない場合）、
そのプロパティは出力から **除去** されます。
ネストした Object についても、内部のすべての解決が失敗した場合は除去されます。

```json
{ "name": "John" }
```

```json
{
  "name": "{name}",
  "identifier": { "type": "SSID", "id": "{ssid}" }
}
```

```json
{ "name": "John" }
```

`ssid` はソース JSON に存在しないため `identifier` ごと除去されます。

トップレベルの全プロパティが解決に失敗した場合、`jx()` は `null` を返します。

```json
{}
```

```json
{ "name": "{name}" }
```

```json
null
```
