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

Validate that all [[Parser#Wiki Links]] in `.lat` markdown files point to existing sections. Exits with error if any broken links are found.

Usage: `lat check`

Implementation: `src/cli/check.ts`

## Section Preview

Shared output format used by [[CLI#locate]] and [[CLI#refs]]. Shows the section id, file path with line range, and the first paragraph of body text.

Implementation: `src/format.ts`
