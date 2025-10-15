import * as fs from 'fs';
import { Dependency, ParseResult, FileType } from '../types';

export async function parsePackageJson(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const packageJson = JSON.parse(content);

  const dependencies: Dependency[] = [];

  // Parse regular dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      dependencies.push({
        name,
        version: version as string,
        isDev: false
      });
    }
  }

  // Parse dev dependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      dependencies.push({
        name,
        version: version as string,
        isDev: true
      });
    }
  }

  return {
    dependencies,
    fileType: FileType.PACKAGE_JSON,
    filePath
  };
}

