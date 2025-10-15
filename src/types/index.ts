export interface Dependency {
  name: string;
  version: string;
  isDev?: boolean;
  integrity?: string;
}

export interface ParseResult {
  dependencies: Dependency[];
  fileType: FileType;
  filePath: string;
}

export enum FileType {
  PACKAGE_JSON = 'package.json',
  PACKAGE_LOCK = 'package-lock.json',
  YARN_LOCK = 'yarn.lock',
  REQUIREMENTS_TXT = 'requirements.txt',
  PIPFILE_LOCK = 'Pipfile.lock',
  POETRY_LOCK = 'poetry.lock'
}

export interface VulnerabilityReport {
  package: string;
  version: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  description: string;
  cveIds: string[];
  advisoryLinks: string[];
  fixedVersions?: string[];
  suggestedUpgrade?: string;
  source: 'OSV' | 'NPM_AUDIT' | 'PYPI' | 'NPM_REGISTRY';
}

export interface CheckerResult {
  totalDependencies: number;
  vulnerabilitiesFound: number;
  vulnerablePackages: number;
  percentageVulnerable: number;
  vulnerabilities: VulnerabilityReport[];
  parseResults: ParseResult[];
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    unknown: number;
  };
}

export interface CLIOptions {
  packageJson?: string;
  packageLock?: string;
  yarnLock?: string;
  requirementsTxt?: string;
  pipfileLock?: string;
  poetryLock?: string;
  json?: boolean | string; // Can be true (console output) or a file path
  verbose?: boolean;
  ignore?: string; // Path to ignore list JSON file
  files?: string[];
}

export interface IgnoreList {
  cveIds?: string[];
  severityIgnore?: Array<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'>;
}

export interface OSVResponse {
  vulns?: OSVVulnerability[];
}

export interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  severity?: Array<{
    type: string;
    score: string;
  }>;
  affected?: Array<{
    package: {
      name: string;
      ecosystem: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
}


