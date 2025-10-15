declare module '@yarnpkg/lockfile' {
  export interface ParseResult {
    type: 'success' | 'merge' | 'conflict';
    object: Record<string, any>;
  }

  export function parse(content: string): ParseResult;
}

