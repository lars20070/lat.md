import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  findLatticeDir,
  listLatticeFiles,
  parseSections,
  extractRefs,
  type Section,
} from '../lattice.js';
import { formatSectionPreview } from '../format.js';
import { scanCodeRefs } from '../code-refs.js';

type Scope = 'md' | 'code' | 'md+code';

function parseArgs(args: string[]): { query: string; scope: Scope } {
  let scope: Scope = 'md';
  const rest: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('--scope=')) {
      const val = arg.slice('--scope='.length);
      if (val === 'md' || val === 'code' || val === 'md+code') {
        scope = val;
      } else {
        console.error(`Unknown scope: ${val}. Use md, code, or md+code.`);
        process.exit(1);
      }
    } else {
      rest.push(arg);
    }
  }

  if (rest.length < 1) {
    console.error('Usage: lat refs <query> [--scope=md|code|md+code]');
    process.exit(1);
  }

  return { query: rest[0], scope };
}

export async function refs(args: string[]): Promise<void> {
  const { query, scope } = parseArgs(args);

  const latticeDir = findLatticeDir();
  if (!latticeDir) {
    console.error('No .lat directory found');
    process.exit(1);
  }

  const q = query.toLowerCase();
  let hasOutput = false;

  if (scope === 'md' || scope === 'md+code') {
    const files = await listLatticeFiles(latticeDir);
    const allSections = await (async () => {
      const s: Section[] = [];
      const contents: string[] = [];
      for (const file of files) {
        const content = await readFile(file, 'utf-8');
        contents.push(content);
        s.push(...parseSections(file, content));
      }
      return { sections: s, files, contents };
    })();

    // Collect refs from all files
    const matchingFromSections: Set<string> = new Set();
    for (let i = 0; i < allSections.files.length; i++) {
      const fileRefs = extractRefs(
        allSections.files[i],
        allSections.contents[i],
      );
      for (const ref of fileRefs) {
        if (ref.target.toLowerCase() === q) {
          matchingFromSections.add(ref.fromSection.toLowerCase());
        }
      }
    }

    if (matchingFromSections.size > 0) {
      const flatAll = flattenAll(allSections.sections);
      const referrers = flatAll.filter((s) =>
        matchingFromSections.has(s.id.toLowerCase()),
      );

      for (const section of referrers) {
        if (hasOutput) console.log('');
        console.log(formatSectionPreview(section, latticeDir));
        hasOutput = true;
      }
    }
  }

  if (scope === 'code' || scope === 'md+code') {
    // Project root is the parent of .lat
    const projectRoot = join(latticeDir, '..');
    const codeRefs = await scanCodeRefs(projectRoot);
    for (const ref of codeRefs) {
      if (ref.target.toLowerCase() === q) {
        if (hasOutput) console.log('');
        console.log(`  ${ref.file}:${ref.line}`);
        hasOutput = true;
      }
    }
  }

  if (!hasOutput) {
    console.error(`No references to "${query}" found`);
    process.exit(1);
  }
}

function flattenAll(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    result.push(s);
    result.push(...flattenAll(s.children));
  }
  return result;
}
