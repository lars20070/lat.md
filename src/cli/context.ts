import { dirname } from 'node:path';
import chalk, { type ChalkInstance } from 'chalk';
import { findLatticeDir } from '../lattice.js';

export type CliContext = {
  latDir: string;
  projectRoot: string;
  color: boolean;
  chalk: ChalkInstance;
};

export function resolveContext(opts: {
  dir?: string;
  color?: boolean;
}): CliContext {
  const color = opts.color !== false;
  if (!color) {
    chalk.level = 0;
  }

  const latDir = findLatticeDir(opts.dir) ?? '';
  if (!latDir) {
    console.error(chalk.red('No lat.md directory found'));
    console.error(chalk.dim('Run `lat init` to create one.'));
    process.exit(1);
  }

  const projectRoot = dirname(latDir);
  return { latDir, projectRoot, color, chalk };
}
