import { parsePackageJson } from './packageJson';
import { parsePackageLock } from './packageLock';
import { parseYarnLock } from './yarnLock';
import { parseRequirementsTxt } from './requirementsTxt';
import { parsePipfileLock } from './pipfileLock';
import { parsePoetryLock } from './poetryLock';
import { ParseResult, FileType } from '../types';
import * as fs from 'fs';

export async function parseFile(filePath: string, fileType: FileType): Promise<ParseResult> {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  switch (fileType) {
    case FileType.PACKAGE_JSON:
      return parsePackageJson(filePath);
    case FileType.PACKAGE_LOCK:
      return parsePackageLock(filePath);
    case FileType.YARN_LOCK:
      return parseYarnLock(filePath);
    case FileType.REQUIREMENTS_TXT:
      return parseRequirementsTxt(filePath);
    case FileType.PIPFILE_LOCK:
      return parsePipfileLock(filePath);
    case FileType.POETRY_LOCK:
      return parsePoetryLock(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export {
  parsePackageJson,
  parsePackageLock,
  parseYarnLock,
  parseRequirementsTxt,
  parsePipfileLock,
  parsePoetryLock
};

