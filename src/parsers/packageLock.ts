import * as fs from 'fs';
import { Dependency, ParseResult, FileType } from '../types';

export async function parsePackageLock(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const packageLock = JSON.parse(content);

  const dependencies: Dependency[] = [];

  // Handle both lockfileVersion 1 and 2+
  if (packageLock.dependencies) {
    // Version 1 format
    for (const [name, info] of Object.entries(packageLock.dependencies)) {
      const depInfo = info as any;
      dependencies.push({
        name,
        version: depInfo.version,
        isDev: depInfo.dev || false,
        integrity: depInfo.integrity
      });
    }
  } else if (packageLock.packages) {
    // Version 2+ format
    for (const [packagePath, info] of Object.entries(packageLock.packages)) {
      if (packagePath === '') continue; // Skip root package

      const depInfo = info as any;
      const name = packagePath.replace('node_modules/', '');
      
      dependencies.push({
        name,
        version: depInfo.version,
        isDev: depInfo.dev || false,
        integrity: depInfo.integrity
      });
    }
  }

  return {
    dependencies,
    fileType: FileType.PACKAGE_LOCK,
    filePath
  };
}

