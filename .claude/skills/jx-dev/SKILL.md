---
name: jx-dev
description: |
  Development skill for the @indigo-lab/jx project — a JSON-to-JSON transformation engine.

  Use this skill when the user wants to:
  - Refactor jx.js (processName / processValue / dig)
  - Edit or extend grammar files (spec/property-name-extension.pegjs, spec/property-value-extension.pegjs)
  - Add new transformation features (new filter operators, new pointer syntax, etc.)
  - Write or improve documentation (README.md, JSDoc, examples)
  - Write or extend tests (tape-based, in test/test-*.js)
  - Understand how the JX transformation spec works

  The skill provides deep context on the spec, code structure, and conventions
  so Claude can make safe, spec-consistent changes without asking for basic context.
compatibility: Node.js 18+, CommonJS
---

# JX Development Skill

## What is JX?

JX is a minimal JSON-to-JSON transformation engine.
A **template** is a plain JSON object; when applied to a **source** JSON, it
produces a new JSON object by expanding `{pointer}` expressions embedded in keys and values.

Entry point: `jx(template, source)` → transformed object (or `null` on total failure)

## File Map

| File | Role |
|------|------|
| `jx.js` | Core engine — `processName`, `processValue`, `dig`, `query`, and the exported function |
| `spec/property-name-extension.pegjs` | Peggy grammar for key expressions (source of truth) |
| `spec/property-value-extension.pegjs` | Peggy grammar for value expressions (source of truth) |
| `lib/property-name-extension.js` | Compiled parser — **generated**, do not edit directly |
| `lib/property-value-extension.js` | Compiled parser — **generated**, do not edit directly |
| `bin/cli.js` | CLI: `jx <template.json> <data.json>` |
| `test/test-jx.js` | Integration tests over `test/standalone/*.json` fixtures |
| `test/test-property-name-extension.js` | Unit tests for the property-name parser |
| `test/test-property-value-extension.js` | Unit tests for the property-value parser |

## Build

```bash
npm run build     # compiles spec/*.pegjs → lib/*.js via Peggy
npm test          # runs tape test/test-*.js
```

Always run `npm run build` after editing a `.pegjs` file before running tests or the engine.

## Core Algorithm (`jx.js`)

### Concepts

- **root** — the root of the source document (never changes during recursion)
- **current** — the current context (changes as the engine traverses nested templates)
- Initially both `root` and `current` point to `source`.

### `query(pointer, root, current)` — pointer resolver

| `pointer` value | Resolves to |
|-----------------|-------------|
| `"."` | `current` |
| `"/"` | `root` |
| starts with `"/"` | `jsonpointer.get(root, pointer)` |
| otherwise | `jsonpointer.get(current, "/" + pointer)` |

### `dig(template, root, current)` — main recursive function

Iterates over every `[name, value]` in the template object:

1. Calls `processName(name, root, current)` → `{ property, pointer, filter, contexts[] }`
2. For each context in `contexts`, for each sub-template in `_asArray(value)`:
   - If sub-template is an object → recurse with `dig(subTemplate, root, ctx)`
   - Otherwise → `processValue(subTemplate, root, ctx)`
3. Accumulates results into `body[property]`:
   - First result → scalar
   - Subsequent results → array (auto-append)
4. Tracks `good` (successful resolutions) and `fail` (missing pointers).
   A result is suppressed if `fail > 0 && good === 0`.

Returns `{ body, good, fail }`.

### `processName(name, root, current)` — key parser

Delegates to `propertyNameExtension.parse(name)`, then resolves contexts:

Key syntax: `"<property>{<pointer>[<filter>]...}"`

- No `{...}` → `{ property: name, pointer: ".", filter: [] }`, contexts = `_asArray(current)`
- `{/}` → contexts = `_asArray(root)`
- `{.}` → contexts = `_asArray(current)` (default)
- `{/pointer}` → resolved from **root** via JSON Pointer
- `{relativeKey}` → resolved from **current** via JSON Pointer (`"/" + relativeKey`)

Optional filters `[condition]` are applied in order to the resolved array:

| Filter form | Meaning |
|-------------|---------|
| `[prop]` | keep elements where `prop` exists |
| `[!prop]` | keep elements where `prop` is absent |
| `[prop=value]` | keep elements where `prop === value` |
| `[prop!=value]` | keep elements where `prop !== value` |
| `[prop>value]`, `[prop<value]`, `[prop>=value]`, `[prop<=value]` | numeric comparison |

String values in filters use single-quotes: `[type='Dataset']`.

### `processValue(value, root, current)` — value interpolator

Delegates to `propertyValueExtension.parse(value)`:

- **SingleBlock** `"{pointer}"` — the entire string is a single `{...}` block → returns
  `{ pointer }` (a plain object, not an array). The resolved value replaces the whole field,
  preserving its original type (object, number, boolean, etc.).
- **AttributeValueTemplate** — mixed string + block(s) → returns an array of strings and
  `{ pointer }` objects. All segments are joined as a string.

| Expression | Resolves to |
|-----------|-------------|
| `{.}` | `current` |
| `{/}` | `root` |
| `{/pointer}` | `jsonpointer.get(root, pointer)` |
| `{relativeKey}` | `jsonpointer.get(current, "/" + relativeKey)` |

Missing pointers increment `fail`; present ones increment `good`.

Non-string values are returned as-is with `{ body: value, good: 0, fail: 0 }`.

### `_asArray(obj)` — coercion helper

`undefined`/`null` → `[]`, array → itself, anything else → `[obj]`

## Grammar Files (`spec/*.pegjs`)

The parsers are the source of truth for syntax. Edit these, then rebuild.

**`spec/property-name-extension.pegjs`** parses a key string into:
```js
{ property: string, pointer: string, filter: Array<{pointer, op, value?}> }
```

**`spec/property-value-extension.pegjs`** parses a value string into either:
- `{ pointer: string }` — SingleBlock (whole-value substitution)
- `Array<string | { pointer: string }>` — AttributeValueTemplate (string interpolation)

## Testing

```bash
npm test          # runs tape test/test-*.js
```

### Integration tests (`test/test-jx.js`)

Reads every JSON file in `test/standalone/` and calls `jx(template, input)`, comparing to `expected`.

Each fixture has this shape:

```json
{
  "title": "short description shown in tap output",
  "input": { ... },
  "template": { ... },
  "expected": { ... }
}
```

To add an integration test, create a new numbered JSON file in `test/standalone/` — no JS edits needed.
Filename ordering controls the output order (e.g. `12foo.json`).

### Unit tests

- `test/test-property-name-extension.js` — tests the Peggy parser for key expressions directly
- `test/test-property-value-extension.js` — tests the Peggy parser for value expressions directly

When adding a new syntax feature, add unit tests in the relevant parser test file as well as an
integration fixture in `test/standalone/`.

## Refactoring Guidelines

- `jx.js` is intentionally small (~95 lines). Keep it that way — parsing logic belongs in `.pegjs`.
- `processName`, `processValue`, and `dig` are pure functions. New features should fit this shape.
- Do not add logging to the core module.
- The `good/fail` accounting matters: a result is silently dropped when
  `fail > 0 && good === 0`. Preserve this invariant when touching value resolution.

## Adding New Features

Typical extension points:

1. **New pointer syntax in keys** → extend `spec/property-name-extension.pegjs` → rebuild
2. **New filter operator** → add a branch in `Condition`/`Relation` in the name grammar, add
   the operation to the `operations` map in `jx.js` → rebuild
3. **New value expression** → extend `spec/property-value-extension.pegjs` → rebuild
4. **New top-level option** → thread an `options` parameter through `dig` / exported function

Always add a test case in `test/` before touching grammar or core logic, then rebuild.

## Documentation Conventions

- README.md is in Japanese (mixed with English code blocks). Keep that tone.
- Spec features are labelled Feature1, Feature2, Feature3, ... in the README.
- New features should follow the same numbered-feature pattern.

## Common Pitfalls

- `jsonpointer.get` returns `undefined` for missing paths — never throws.
  The engine treats `undefined` as a failed resolution.
- `lib/*.js` are **generated files**. Never edit them directly — changes will be overwritten
  on the next `npm run build`. Edit the corresponding `spec/*.pegjs` instead.
- `_asArray` is called defensively throughout; a null/undefined context should always
  produce zero iterations, not a crash.
- The fixture key for the template is `"template"` (not `"mapping"`).
