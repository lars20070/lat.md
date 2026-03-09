import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import {
  findLatticeDir,
  listLatticeFiles,
  extractRefs,
  loadAllSections,
  type Section,
} from '../lattice.js';

function flattenAll(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    result.push(s);
    result.push(...flattenAll(s.children));
  }
  return result;
}

export type CheckError = {
  file: string;
  line: number;
  target: string;
  message: string;
};

export async function checkLinks(latticeDir: string): Promise<CheckError[]> {
  const files = await listLatticeFiles(latticeDir);
  const allSections = await loadAllSections(latticeDir);
  const flat = flattenAll(allSections);
  const sectionIds = new Set(flat.map((s) => s.id.toLowerCase()));

  const errors: CheckError[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const refs = extractRefs(file, content);
    const relPath = relative(process.cwd(), file);

    for (const ref of refs) {
      const target = ref.target.toLowerCase();
      if (!sectionIds.has(target)) {
        errors.push({
          file: relPath,
          line: ref.line,
          target: ref.target,
          message: `broken link [[${ref.target}]] — no matching section found`,
        });
      }
    }
  }

  return errors;
}

export async function check(_args: string[]): Promise<void> {
  const latticeDir = findLatticeDir();
  if (!latticeDir) {
    console.error('No .lat directory found');
    process.exit(1);
  }

  const errors = await checkLinks(latticeDir);

  for (const err of errors) {
    console.error(`${err.file}:${err.line}: ${err.message}`);
  }

  if (errors.length > 0) {
    console.error(
      `\n${errors.length} broken link${errors.length === 1 ? '' : 's'} found`,
    );
    process.exit(1);
  }

  console.log('All links OK');
}
