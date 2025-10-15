import { Command } from 'commander';
import { CLIOptions, FileType } from './types';
import * as path from 'path';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('security-checker')
    .description('Check dependencies for security vulnerabilities across multiple package managers')
    .version('1.0.0')
    .argument('[files...]', 'Dependency files to check (package.json, yarn.lock, requirements.txt, poetry.lock, etc.)')
    .option('--package-json <path>', 'Path to package.json file')
    .option('--package-lock <path>', 'Path to package-lock.json file')
    .option('--yarn-lock <path>', 'Path to yarn.lock file')
    .option('--requirements-txt <path>', 'Path to requirements.txt file')
    .option('--pipfile-lock <path>', 'Path to Pipfile.lock file')
    .option('--poetry-lock <path>', 'Path to poetry.lock file')
    .option('--json [path]', 'Output results as JSON (optionally to a file)')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--ignore <path>', 'Path to ignore list JSON file (CVE IDs and severities to suppress)');

  return program;
}

export function parseCLIOptions(program: Command): CLIOptions {
  const opts = program.opts();
  const args = program.args;

  const options: CLIOptions = {
    packageJson: opts.packageJson,
    packageLock: opts.packageLock,
    yarnLock: opts.yarnLock,
    requirementsTxt: opts.requirementsTxt,
    pipfileLock: opts.pipfileLock,
    poetryLock: opts.poetryLock,
    json: opts.json || false, // Can be true (boolean) or a file path (string)
    verbose: opts.verbose || false,
    ignore: opts.ignore,
    files: args
  };

  return options;
}

export function detectFileType(filePath: string): FileType | null {
  const basename = path.basename(filePath).toLowerCase();
  
  if (basename === 'package.json') return FileType.PACKAGE_JSON;
  if (basename === 'package-lock.json') return FileType.PACKAGE_LOCK;
  if (basename === 'yarn.lock') return FileType.YARN_LOCK;
  if (basename === 'requirements.txt') return FileType.REQUIREMENTS_TXT;
  if (basename === 'pipfile.lock') return FileType.PIPFILE_LOCK;
  if (basename === 'poetry.lock') return FileType.POETRY_LOCK;
  
  return null;
}

export function prioritizeFiles(options: CLIOptions): CLIOptions {
  const result: CLIOptions = { ...options };
  
  // JavaScript/Node.js: Lock files have priority over manifest
  // If both package.json and package-lock.json are provided, prioritize package-lock.json
  if (result.packageJson && result.packageLock) {
    result.packageJson = undefined;
  }
  
  // If both package.json and yarn.lock are provided, prioritize yarn.lock
  if (result.packageJson && result.yarnLock) {
    result.packageJson = undefined;
  }
  
  // Python: Lock files have priority over requirements.txt
  // If requirements.txt and any lock file are provided, prioritize the lock file
  if (result.requirementsTxt && (result.pipfileLock || result.poetryLock)) {
    result.requirementsTxt = undefined;
  }
  
  // If both Pipfile.lock and poetry.lock are provided, keep both
  // (they come from different tools and user likely wants both scanned)
  
  return result;
}
