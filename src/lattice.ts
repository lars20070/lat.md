import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, basename, resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { parse } from './parser.js';
import { visit } from 'unist-util-visit';
import type { Heading, Text } from 'mdast';

export type Section = {
  id: string;
  heading: string;
  depth: number;
  file: string;
  children: Section[];
};

export function findLatticeDir(from?: string): string | null {
  let dir = resolve(from ?? process.cwd());
  while (true) {
    const candidate = join(dir, '.lattice');
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function listLatticeFiles(latticeDir: string): Promise<string[]> {
  const entries = await readdir(latticeDir);
  return entries
    .filter((e) => e.endsWith('.md'))
    .sort()
    .map((e) => join(latticeDir, e));
}

function headingText(node: Heading): string {
  return node.children
    .filter((c): c is Text => c.type === 'text')
    .map((c) => c.value)
    .join('');
}

export function parseSections(filePath: string, content: string): Section[] {
  const tree = parse(content);
  const file = basename(filePath, '.md');
  const roots: Section[] = [];
  const stack: Section[] = [];

  visit(tree, 'heading', (node: Heading) => {
    const heading = headingText(node);
    const depth = node.depth;

    // Pop stack until we find a parent with smaller depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1] : null;
    const id = parent ? `${parent.id}#${heading}` : heading;

    const section: Section = { id, heading, depth, file, children: [] };

    if (parent) {
      parent.children.push(section);
    } else {
      roots.push(section);
    }

    stack.push(section);
  });

  return roots;
}

export async function loadAllSections(latticeDir: string): Promise<Section[]> {
  const files = await listLatticeFiles(latticeDir);
  const all: Section[] = [];
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    all.push(...parseSections(file, content));
  }
  return all;
}

function flattenSections(sections: Section[]): Section[] {
  const result: Section[] = [];
  for (const s of sections) {
    result.push(s);
    result.push(...flattenSections(s.children));
  }
  return result;
}

export function findSections(sections: Section[], query: string): Section[] {
  const flat = flattenSections(sections);
  const q = query.toLowerCase();
  return flat.filter((s) => s.id.toLowerCase() === q);
}
