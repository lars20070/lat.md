import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
  findLatticeDir,
  listLatticeFiles,
  loadAllSections,
  extractRefs,
  flattenSections,
  parseFrontmatter,
  parseSections,
  type Section,
} from '../lattice.js';
import { scanCodeRefs } from '../code-refs.js';

export type CheckError = {
  file: string;
  line: number;
  target: string;
  message: string;
};

export async function checkMd(latticeDir: string): Promise<CheckError[]> {
  const files = await listLatticeFiles(latticeDir);
  const allSections = await loadAllSections(latticeDir);
  const flat = flattenSections(allSections);
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

export async function checkCodeRefs(
  latticeDir: string,
): Promise<CheckError[]> {
  const projectRoot = join(latticeDir, '..');
  const allSections = await loadAllSections(latticeDir);
  const flat = flattenSections(allSections);
  const sectionIds = new Set(flat.map((s) => s.id.toLowerCase()));

  const codeRefs = await scanCodeRefs(projectRoot);
  const errors: CheckError[] = [];

  // 1. Check that all @lat: comments point to real sections
  const mentionedSections = new Set<string>();
  for (const ref of codeRefs) {
    const target = ref.target.toLowerCase();
    mentionedSections.add(target);
    if (!sectionIds.has(target)) {
      errors.push({
        file: ref.file,
        line: ref.line,
        target: ref.target,
        message: `@lat: [[${ref.target}]] — no matching section found`,
      });
    }
  }

  // 2. Check require-code-mention coverage
  const files = await listLatticeFiles(latticeDir);
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm.requireCodeMention) continue;

    const sections = parseSections(file, content);
    const fileSections = flattenSections(sections);
    const leafSections = fileSections.filter((s) => s.children.length === 0);
    const relPath = relative(process.cwd(), file);

    for (const leaf of leafSections) {
      if (!mentionedSections.has(leaf.id.toLowerCase())) {
        errors.push({
          file: relPath,
          line: leaf.startLine,
          target: leaf.id,
          message: `section "${leaf.id}" requires a code mention but none found`,
        });
      }
    }
  }

  return errors;
}

// Legacy export for existing tests
export async function checkLinks(latticeDir: string): Promise<CheckError[]> {
  return checkMd(latticeDir);
}

function formatErrors(errors: CheckError[]): void {
  for (const err of errors) {
    console.error(`${err.file}:${err.line}: ${err.message}`);
  }
  if (errors.length > 0) {
    console.error(
      `\n${errors.length} error${errors.length === 1 ? '' : 's'} found`,
    );
  }
}

export async function check(args: string[]): Promise<void> {
  const latticeDir = findLatticeDir();
  if (!latticeDir) {
    console.error('No .lat directory found');
    process.exit(1);
  }

  const subcommand = args[0];

  if (subcommand === 'md') {
    const errors = await checkMd(latticeDir);
    formatErrors(errors);
    if (errors.length > 0) process.exit(1);
    console.log('md: All links OK');
    return;
  }

  if (subcommand === 'code-refs') {
    const errors = await checkCodeRefs(latticeDir);
    formatErrors(errors);
    if (errors.length > 0) process.exit(1);
    console.log('code-refs: All references OK');
    return;
  }

  if (subcommand && subcommand !== 'md' && subcommand !== 'code-refs') {
    console.error(
      `Unknown check subcommand: ${subcommand}\n\nUsage: lat check [md|code-refs]`,
    );
    process.exit(1);
  }

  // No subcommand: run all checks
  const mdErrors = await checkMd(latticeDir);
  const codeErrors = await checkCodeRefs(latticeDir);
  const allErrors = [...mdErrors, ...codeErrors];

  formatErrors(allErrors);
  if (allErrors.length > 0) process.exit(1);
  console.log('All checks passed');
}
