import * as fs from 'fs';
import { Dependency, ParseResult, FileType } from '../types';

export async function parseRequirementsTxt(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const dependencies: Dependency[] = [];

  for (const line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse different requirement formats
    // Examples: package==1.0.0, package>=1.0.0, package~=1.0.0, package
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)([~=><]+)?([0-9.]+)?/);
    
    if (match) {
      const name = match[1];
      const version = match[3] || 'latest';

      dependencies.push({
        name,
        version,
        isDev: false
      });
    }
  }

  return {
    dependencies,
    fileType: FileType.REQUIREMENTS_TXT,
    filePath
  };
}

