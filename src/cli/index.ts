#!/usr/bin/env node

import { locate } from './locate.js';
import { refs } from './refs.js';
import { check } from './check.js';

const args = process.argv.slice(2);
const command = args[0];

const commands: Record<string, (args: string[]) => Promise<void>> = {
  locate,
  refs,
  check,
};

const handler = commands[command];
if (!handler) {
  console.error(`Usage: lat <command>

Commands:
  locate <query>                          Find sections by id
  refs <query> [--scope=md|code|md+code]  Find references to a section
  check                                   Validate all wiki links in .lat`);
  process.exit(1);
}

await handler(args.slice(1));
