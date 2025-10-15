import * as fs from 'fs';
import { Dependency, ParseResult, FileType } from '../types';

export async function parsePipfileLock(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const pipfile = JSON.parse(content);

  const dependencies: Dependency[] = [];

  // Parse default dependencies
  if (pipfile.default) {
    for (const [name, info] of Object.entries(pipfile.default)) {
      const depInfo = info as any;
      const version = depInfo.version?.replace('==', '') || 'latest';

      dependencies.push({
        name,
        version,
        isDev: false
      });
    }
  }

  // Parse dev dependencies
  if (pipfile.develop) {
    for (const [name, info] of Object.entries(pipfile.develop)) {
      const depInfo = info as any;
      const version = depInfo.version?.replace('==', '') || 'latest';

      dependencies.push({
        name,
        version,
        isDev: true
      });
    }
  }

  return {
    dependencies,
    fileType: FileType.PIPFILE_LOCK,
    filePath
  };
}

