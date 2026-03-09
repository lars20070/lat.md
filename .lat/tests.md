# Tests

High-level test descriptions. Actual test code lives in `tests/`.

## Section Parsing

### Builds a section tree from nested headings

Parse a markdown file with nested headings and verify the resulting tree has correct ids, depths, parent-child relationships, and file stems.

### Populates position and body fields

Verify that `startLine`, `endLine`, and `body` are correctly extracted from heading positions and first-paragraph text.

## Ref Extraction

### Extracts wiki link references

Parse a file containing [[Parser#Wiki Links]] and verify `extractRefs` returns correct targets, enclosing section ids, file stems, and line numbers.

### Returns empty for files without links

Verify `extractRefs` returns an empty array when a file has no wiki links.

## Section Preview Formatting

### Formats section with body

Verify [[CLI#Section Preview]] output includes section id, file path with line range, and indented body text.

### Formats section without body

Verify [[CLI#Section Preview]] omits the body lines when a section has no paragraph content.

## Link Checking

### Detects broken links

Given a file with a wiki link pointing to a nonexistent section, [[CLI#check]] should report it as a broken link.

### Passes with valid links

Given files where all wiki links resolve to existing sections, [[CLI#check]] should report no errors.

## Locate

### Finds sections by exact id

Given a query matching a section id (case-insensitive), `findSections` returns the matching section with correct metadata.

## Refs End-to-End

### Finds referring sections via wiki links

Load multiple files, extract refs, and verify that sections containing wiki links targeting a given section are correctly identified.
