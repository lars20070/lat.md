# Markdown

Extensions to standard markdown used in `lat.md` files.

## Wiki Links

Obsidian-style links: `[[target]]` or `[[target|alias]]`. Uses `|` as the alias divider.

Targets are section ids — hierarchical paths like `lat.md/dev-process#Testing#Running Tests`. The vault root is the project directory (the parent of `lat.md/`), so all markdown section ids include the `lat.md/` prefix. Wiki links can also reference source code symbols — see [[markdown#Wiki Links#Source Code Links]].

Validated by [[cli#check#md]].

### Resolution Rules

Aligned with Obsidian conventions:

- **`[[foo]]`** — link to the **file** `foo.md`. Resolves to the root section of that file. Does not search section headings.
- **`[[foo#Bar]]`** — heading `Bar` in file `foo.md`. The path after `#` must be an exact heading chain — no intermediate headings can be omitted.
- **`[[path/foo#Bar]]`** — fully qualified: file `path/foo.md`, heading `Bar`.

### Short Path Disambiguation

Short refs are supported for markdown files inside `lat.md/` only. When a file stem is unique across the vault, it can be used without its directory prefix. For example, `[[setup#Install]]` resolves to `lat.md/guides/setup#Install` if `setup.md` only exists under `lat.md/guides/`.

When multiple files share the same stem (e.g. `alpha/notes.md` and `beta/notes.md`), the short form is ambiguous — [[cli#check#md]] reports an error listing all candidates. If the referenced section exists in only one file, the error suggests the specific fix.

Source code references (e.g. `[[src/config.ts#getConfigDir]]`) always require the full path — no short refs for source files.

Resolution is handled by [[src/lattice.ts#resolveRef]]. See [[parser#Short Ref Resolution]] for implementation details.

### Source Code Links

Wiki links can reference functions, classes, constants, and methods in TypeScript, JavaScript, and Python source files:

- **`[[src/config.ts#getConfigDir]]`** — the `getConfigDir` function in `src/config.ts`
- **`[[src/server.ts#App#listen]]`** — the `listen` method on class `App` in `src/server.ts`
- **`[[src/config.ts]]`** — link to the file itself (no symbol)

Source code is parsed lazily with tree-sitter (via `web-tree-sitter`). Only files referenced by wiki links are parsed — no up-front scanning. [[cli#check#md]] validates that the file exists and the symbol is defined.

### Strict vs Lenient Contexts

**Strict** — `lat check` and `lat refs` use `resolveRef()` directly. Links must resolve unambiguously to a known section. Ambiguous or broken links are errors.

**Lenient** — `lat locate` and `lat prompt` use `findSections()`, which applies tiered matching (exact → file stem → subsection tail → fuzzy). These commands are for interactive exploration and accept approximate queries.

## Frontmatter

`lat.md` files support YAML frontmatter for per-file configuration:

```yaml
---
lat:
  require-code-mention: true
---
```

### require-code-mention

When set to `true`, [[cli#check#code-refs]] ensures every leaf section (sections with no children) in the file has a corresponding `// @lat: [[...]]` reference in source code. Useful for test specs and requirements that must be traceable to implementation.
