import * as fs from 'fs';
import * as lockfile from '@yarnpkg/lockfile';
import { Dependency, ParseResult, FileType } from '../types';

export async function parseYarnLock(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const parsed = lockfile.parse(content);

  if (parsed.type !== 'success') {
    throw new Error('Failed to parse yarn.lock file');
  }

  const dependencies: Dependency[] = [];
  const seen = new Set<string>();

  for (const [key, value] of Object.entries(parsed.object)) {
    const depValue = value as any;
    
    // Extract package name from the key (format: "package@version" or "@scope/package@version")
    const match = key.match(/^(@?[^@]+)@/);
    if (!match) continue;

    const name = match[1];
    const version = depValue.version;

    // Avoid duplicates
    const uniqueKey = `${name}@${version}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    dependencies.push({
      name,
      version,
      isDev: false, // yarn.lock doesn't distinguish dev/prod
      integrity: depValue.integrity
    });
  }

  return {
    dependencies,
    fileType: FileType.YARN_LOCK,
    filePath
  };
}

