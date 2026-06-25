---
name: jx-dev
description: |
  Development skill for the @indigo-lab/jx project — a JSON-to-JSON transformation engine.

  Use this skill when the user wants to:
  - Refactor jx.js (processKey / processValue / dig)
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
A **template** (mapping) is a plain JSON object; when applied to a **source** JSON, it
produces a new JSON object by expanding `{pointer}` expressions embedded in keys and values.

Entry point: `jx(template, source)` → transformed object (or `null` on total failure)

## File Map

| File | Role |
|------|------|
| `jx.js` | Core engine — `processKey`, `processValue`, `dig`, and the exported function |
| `bin/cli.js` | CLI: `jx <mapping.json> <data.json>` |
| `test/test-*.js` | tape test suites |
| `a.js` | Scratch / exploration file (not part of the public API) |

## Core Algorithm (`jx.js`)

### Concepts

- **head** — the root of the source document (never changes during recursion)
- **tail** — the current context (changes as the engine traverses nested templates)
- Initially both `head` and `tail` point to `source`.

### `dig(template, head, tail)` — main recursive function

Iterates over every `[key, val]` in the template object:

1. Calls `processKey(key, head, tail)` → `{ property, contexts[] }`
2. For each context in `contexts`, for each sub-template in `$array(val)`:
   - If sub-template is an object → recurse with `dig(subTemplate, head, ctx)`
   - Otherwise → `processValue(subTemplate, head, ctx)`
3. Accumulates results into `body[property]`:
   - First result → scalar
   - Subsequent results → array (auto-append)
4. Tracks `good` (successful resolutions) and `fail` (missing pointers).
   A result is suppressed if `fail > 0 && good === 0`.

Returns `{ body, good, fail }`.

### `processKey(key, head, tail)` — key parser

Key syntax: `"<property>{<pointer>[<filter>]...}"`

- No `{...}` → `{ property: key, contexts: $array(tail) }` (identity)
- `{/}` → contexts = `$array(head)` (root)
- `{.}` → contexts = `$array(tail)` (current context, default)
- `{/pointer}` → resolved from **head** via JSON Pointer
- `{relativeKey}` → resolved from **tail** via JSON Pointer (`"/" + relativeKey`)

Optional filters `[condition]` are applied in order to the resolved array:

| Filter form | Meaning |
|-------------|---------|
| `[prop]` | keep elements where `prop` exists |
| `[!prop]` | keep elements where `prop` is absent |
| `[prop=value]` | keep elements where `prop === value` (JSON-parsed value) |
| `[prop!=value]` | keep elements where `prop !== value` |
| `[prop>value]`, `[prop<value]`, `[prop>=value]`, `[prop<=value]` | numeric comparison |

Single-quoted string values in filters are normalized to double-quoted before `JSON.parse`.

`{.}` can also appear as the pointer part of a key: `"key{.[filter]}"` filters the current tail
itself (e.g. `"accessRights{.[public=true]}"` iterates over tail when its `public` field is `true`).

`{/pointer}` in a key resolves from **head**, not tail — useful when iterating over
a top-level array while still referencing sibling fields of the root
(e.g. `"dist{/files}"` + value `"@id": "https://example.org/{/name}/{name}"`
where `{/name}` is the root name and `{name}` is the current file's name).

### `processValue(value, head, tail)` — value interpolator

Scans a string for `{...}` blocks:

| Expression | Resolves to |
|-----------|-------------|
| `{.}` | current `tail` |
| `{/}` | `head` |
| `{/pointer}` | `jsonpointer.get(head, pointer)` |
| `{relativeKey}` | `jsonpointer.get(tail, "/" + relativeKey)` |

- If the string is a single `{...}` block, the resolved value replaces the entire string
  (preserving its original type — object, number, boolean, etc.).
- If there are surrounding characters, all segments are joined as a string.
- Missing pointers increment `fail`; present ones increment `good`.

Non-string values are returned as-is.

### `$array(obj)` — coercion helper

`undefined`/`null` → `[]`, array → itself, anything else → `[obj]`

## Testing

```bash
npm test          # runs tape test/test-*.js
node a.js         # quick sandbox
```

Test cases live in `test/standalone/*.json`. The runner `test/test-standalone.js`
reads every file in that directory and calls `jx(mapping, input)`, comparing to `expected`.

Each fixture has this shape:

```json
{
  "title": "short description shown in tap output",
  "input": { ... },
  "mapping": { ... },
  "expected": { ... }
}
```

To add a test case, create a new numbered JSON file in `test/standalone/` — no JS edits needed.
Filename ordering controls the output order (e.g. `11foo.json`).

## Refactoring Guidelines

- `jx.js` is intentionally small (~125 lines). Keep it that way.
- `processKey`, `processValue`, and `dig` are pure functions of `(input, head, tail)`.
  New features should fit this shape.
- Do not add logging to the core module (only `console.error` in `processKey` for
  malformed filters is intentional — it's a programmer error signal).
- The `good/fail` accounting matters: a result is silently dropped when
  `fail > 0 && good === 0`. Preserve this invariant when touching value resolution.

## Adding New Features

Typical extension points:

1. **New pointer syntax in keys** → extend `processKey` regex + resolution branch
2. **New filter operator** → add a branch in the filter loop inside `processKey`
3. **New value expression** → extend `processValue` scanning loop
4. **New top-level option** → thread an `options` parameter through `dig` / exported function

Always add a test case in `test/` before touching core logic.

## Documentation Conventions

- README.md is in Japanese (mixed with English code blocks). Keep that tone.
- Spec features are labelled Feature1, Feature2, Feature3, ... in the README.
- New features should follow the same numbered-feature pattern.
- JSDoc is not currently used; if added, keep it brief (one-liner per param is enough).

## Common Pitfalls

- `jsonpointer.get` returns `undefined` for missing paths — never throws.
  The engine treats `undefined` as a failed resolution.
- The regex in `processKey` uses a two-step match; the second step captures repeated
  `[filter]` groups via `re[2]` and `re.slice(2)`. This is subtly fragile; take care
  when modifying the regex.
- `$array` is called defensively throughout; a null/undefined context should always
  produce zero iterations, not a crash.
