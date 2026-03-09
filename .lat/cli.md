# CLI

The `lat` command line tool. Entry point: `src/cli/index.ts`.

## locate

Find sections by id (case-insensitive exact match). Outputs a [[CLI#Section Preview]] for each match.

Usage: `lat locate <query>`

Implementation: `src/cli/locate.ts`

## refs

Find sections that reference a given section via [[Parser#Wiki Links]]. Outputs a [[CLI#Section Preview]] for each referring section.

Usage: `lat refs <query> [--scope=md|code|md+code]`

### Scope

- `md` (default) — search `.lat` markdown files for wiki links targeting the query
- `code` — scan source files for `@lat: [[...]]` comments matching the query
- `md+code` — both

Implementation: `src/cli/refs.ts`

## check

Validation command group. Runs all checks when invoked without a subcommand.

Usage: `lat check [md|code-refs]`

Implementation: `src/cli/check.ts`

### md

Validate that all [[Parser#Wiki Links]] in `.lat` markdown files point to existing sections.

### code-refs

Two validations:
1. Every `// @lat: [[...]]` comment in source code must point to a real section in `.lat/`
2. For files with [[Markdown#Frontmatter#require-code-mention]], every leaf section must be referenced by at least one `// @lat:` comment in the codebase

## Section Preview

Shared output format used by [[CLI#locate]] and [[CLI#refs]]. Shows the section id, file path with line range, and the first paragraph of body text.

Implementation: `src/format.ts`
