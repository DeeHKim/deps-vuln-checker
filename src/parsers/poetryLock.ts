import * as fs from 'fs';
import { Dependency, ParseResult, FileType } from '../types';

interface PoetryPackage {
  name: string;
  version: string;
  category?: string;
  dependencies?: { [key: string]: string };
}

export async function parsePoetryLock(filePath: string): Promise<ParseResult> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  
  const dependencies: Dependency[] = [];
  
  // Poetry lock files use TOML format
  // Parse package sections that look like:
  // [[package]]
  // name = "package-name"
  // version = "1.0.0"
  // category = "main" or "dev"
  
  const packageRegex = /\[\[package\]\]\s*name\s*=\s*"([^"]+)"\s*version\s*=\s*"([^"]+)"(?:[\s\S]*?category\s*=\s*"([^"]+)")?/g;
  
  let match;
  while ((match = packageRegex.exec(content)) !== null) {
    const name = match[1];
    const version = match[2];
    const category = match[3] || 'main';
    
    dependencies.push({
      name,
      version,
      isDev: category === 'dev'
    });
  }

  return {
    dependencies,
    fileType: FileType.POETRY_LOCK,
    filePath
  };
}

