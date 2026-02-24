import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  findLatticeDir,
  listLatticeFiles,
  parseSections,
  loadAllSections,
  findSections,
} from '../src/lattice.js'

describe('findLatticeDir', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'lattice-test-'))
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true })
  })

  it('finds .lattice in the given directory', () => {
    mkdirSync(join(tmp, '.lattice'))
    expect(findLatticeDir(tmp)).toBe(join(tmp, '.lattice'))
  })

  it('finds .lattice in a parent directory', () => {
    mkdirSync(join(tmp, '.lattice'))
    const child = join(tmp, 'a', 'b', 'c')
    mkdirSync(child, { recursive: true })
    expect(findLatticeDir(child)).toBe(join(tmp, '.lattice'))
  })

  it('returns null when no .lattice exists', () => {
    expect(findLatticeDir(tmp)).toBeNull()
  })
})

describe('listLatticeFiles', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'lattice-test-'))
    mkdirSync(join(tmp, '.lattice'))
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true })
  })

  it('lists .md files sorted alphabetically', async () => {
    writeFileSync(join(tmp, '.lattice', 'b.md'), '# B')
    writeFileSync(join(tmp, '.lattice', 'a.md'), '# A')
    writeFileSync(join(tmp, '.lattice', 'not-md.txt'), 'nope')

    const files = await listLatticeFiles(join(tmp, '.lattice'))
    expect(files).toEqual([
      join(tmp, '.lattice', 'a.md'),
      join(tmp, '.lattice', 'b.md'),
    ])
  })
})

describe('parseSections', () => {
  it('builds a section tree from nested headings', () => {
    const md = `# Top

## Child A

### Grandchild

## Child B
`
    const sections = parseSections('example.md', md)

    expect(sections).toHaveLength(1)
    const top = sections[0]
    expect(top.id).toBe('Top')
    expect(top.heading).toBe('Top')
    expect(top.depth).toBe(1)
    expect(top.file).toBe('example')
    expect(top.children).toHaveLength(2)

    const childA = top.children[0]
    expect(childA.id).toBe('Top#Child A')
    expect(childA.children).toHaveLength(1)
    expect(childA.children[0].id).toBe('Top#Child A#Grandchild')

    const childB = top.children[1]
    expect(childB.id).toBe('Top#Child B')
    expect(childB.children).toHaveLength(0)
  })

  it('handles multiple top-level headings', () => {
    const md = `# First

# Second
`
    const sections = parseSections('multi.md', md)
    expect(sections).toHaveLength(2)
    expect(sections[0].id).toBe('First')
    expect(sections[1].id).toBe('Second')
  })

  it('uses file stem without .md extension', () => {
    const sections = parseSections('/path/to/notes.md', '# Hello')
    expect(sections[0].file).toBe('notes')
  })
})

describe('end-to-end locate', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'lattice-test-'))
    mkdirSync(join(tmp, '.lattice'))
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true })
  })

  it('finds sections by exact id match (case-insensitive)', async () => {
    writeFileSync(
      join(tmp, '.lattice', 'dev-process.md'),
      `# Dev Process

## Testing

### Running Tests

Run tests with vitest.

## Formatting

Prettier all the things.
`,
    )

    const latticeDir = join(tmp, '.lattice')
    const sections = await loadAllSections(latticeDir)
    const matches = findSections(sections, 'Dev Process#Testing#Running Tests')

    expect(matches).toHaveLength(1)
    expect(matches[0].id).toBe('Dev Process#Testing#Running Tests')
    expect(matches[0].file).toBe('dev-process')
  })

  it('returns empty for non-matching query', async () => {
    writeFileSync(join(tmp, '.lattice', 'notes.md'), '# Notes\n')

    const latticeDir = join(tmp, '.lattice')
    const sections = await loadAllSections(latticeDir)
    const matches = findSections(sections, 'Nonexistent')

    expect(matches).toHaveLength(0)
  })
})
