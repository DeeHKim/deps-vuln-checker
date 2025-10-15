# Security Checker CLI - Project Summary

## Overview

A production-ready TypeScript CLI tool that scans dependency files for security vulnerabilities using multiple sources:
- **npm Registry Audit API** - npm's official vulnerability API
- **OSV.dev** - Open Source Vulnerabilities database
- **PyPI Advisory Database** - Python Packaging Advisory Database

## Complete File Structure

```
security-checker/
├── bin/
│   └── security-checker              # Executable entry point
│
├── src/
│   ├── index.ts                      # Main application logic
│   ├── cli.ts                        # CLI parsing & lock file priority
│   │
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces & enums
│   │
│   ├── parsers/                      # Dependency file parsers
│   │   ├── index.ts
│   │   ├── packageJson.ts            # npm manifest
│   │   ├── packageLock.ts            # npm lock (transitive deps)
│   │   ├── yarnLock.ts               # Yarn lock (transitive deps)
│   │   ├── requirementsTxt.ts        # pip requirements
│   │   ├── pipfileLock.ts            # Pipenv lock (transitive deps)
│   │   └── poetryLock.ts             # Poetry lock (transitive deps)
│   │
│   ├── services/                     # Vulnerability APIs
│   │   ├── index.ts
│   │   ├── npmRegistryService.ts     # npm Registry Audit API
│   │   ├── osvService.ts             # OSV.dev integration
│   │   └── pypiAdvisoryService.ts    # PyPI Advisory Database
│   │
│   ├── checkers/                     # Vulnerability orchestration
│   │   ├── index.ts
│   │   └── vulnerabilityChecker.ts   # Main checking logic
│   │
│   └── utils/
│       └── logger.ts                 # Colored console output
│
├── examples/                         # Test files
│   ├── test-package.json
│   └── test-requirements.txt
│
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── .gitignore                        # Git ignore
├── .npmignore                        # npm publish ignore
├── .editorconfig                     # Editor config
│
├── README.md                         # Main documentation
├── USAGE.md                          # Detailed usage guide
└── IMPLEMENTATION_NOTES.md           # Architecture details
```

## Key Features Implemented

✅ **Multi-Database Scanning**
- npm Registry Audit API for JavaScript packages
- OSV.dev API integration with batch processing
- PyPI Advisory Database for Python packages

✅ **Transitive Dependencies**
- Lock files (package-lock.json, yarn.lock, Pipfile.lock, poetry.lock) include full dependency trees
- All transitive dependencies are scanned for vulnerabilities

✅ **Lock File Priority**
- Automatically prioritizes lock files over manifests
- Ensures accurate scanning with exact versions

✅ **Comprehensive Reports**
- CVE IDs and vulnerability identifiers
- Severity levels (CRITICAL, HIGH, MODERATE, LOW)
- Advisory links to security databases
- Suggested upgrade versions
- Remediation commands

✅ **Dual Output Formats**
- Human-readable console output with colors
- Machine-readable JSON for CI/CD integration

✅ **CLI Flexibility**
- Positional arguments: `security-checker package-lock.json`
- Named options: `--package-lock ./package-lock.json`
- Multiple file support
- Verbose and JSON modes

## Usage Examples

### Basic Usage
```bash
# Scan a lock file (includes transitive dependencies)
./bin/security-checker package-lock.json

# Scan multiple files
./bin/security-checker package-lock.json requirements.txt

# JSON output for automation
./bin/security-checker package-lock.json --json

# Verbose mode (shows advisory URLs)
./bin/security-checker package-lock.json --verbose
```


## Output Example

### Console Output
```
📋 Parsing dependency files...
✓ Parsed 1247 dependencies from package-lock.json

🔍 Checking for vulnerabilities...

📊 Results Summary
  Total dependencies scanned: 1247
  Vulnerable packages: 15 (1.2%)
  Total vulnerabilities: 23

  Severity breakdown:
    🔴 Critical: 3
    🟠 High: 7
    🟡 Moderate: 10
    🟢 Low: 3

🚨 Vulnerabilities Details

  [CRITICAL] lodash@4.17.15
    Prototype Pollution vulnerability in lodash
    CVE IDs: CVE-2020-8203
    Fix available: Upgrade to 4.17.21

💡 Remediation Summary
  23 out of 23 vulnerabilities have fixes available.

  For npm/yarn packages:
    npm install lodash@4.17.21
```

### JSON Output
```json
{
  "summary": {
    "totalDependencies": 1247,
    "vulnerablePackages": 15,
    "percentageVulnerable": 1.2,
    "vulnerabilitiesFound": 23,
    "bySeverity": {
      "critical": 3,
      "high": 7,
      "moderate": 10,
      "low": 3,
      "unknown": 0
    }
  },
  "vulnerabilities": [...],
  "scannedFiles": [...]
}
```

## Technical Highlights

### Lock File Priority Logic
When both manifest and lock files are provided, the tool automatically uses lock files:
- `package.json` + `package-lock.json` → uses `package-lock.json`
- `package.json` + `yarn.lock` → uses `yarn.lock`
- `requirements.txt` + `Pipfile.lock` → uses `Pipfile.lock`

### Vulnerability Deduplication
Results from multiple sources are deduplicated by `package@version` key, ensuring each vulnerability is reported once.

### Error Resilience
- API failures don't crash the tool
- npm audit failures logged but scanning continues

### Performance
- Batch processing for OSV API (10 concurrent requests)
- Parallel checks across npm Registry, OSV, and PyPI databases

## Setup & Development

### Build
```bash
npm install
npm run build
```

### Run
```bash
npm start -- package-lock.json
# or
./bin/security-checker package-lock.json
```

### Watch Mode
```bash
npm run dev
```

## Exit Codes

- `0` - No vulnerabilities found
- `1` - Vulnerabilities found OR error occurred

## Dependencies

### Runtime
- `commander` - CLI argument parsing
- `chalk` - Colored terminal output
- `axios` - HTTP requests
- `@yarnpkg/lockfile` - Yarn lock file parsing

### Development
- `typescript` - Type safety
- `@types/node` - Node.js types

## Environment Variables


## Requirements Met

✅ Accepts package-lock.json, yarn.lock, package.json  
✅ Accepts requirements.txt, Pipfile.lock, and poetry.lock  
✅ Prioritizes lock files when both manifest and lock provided  
✅ Checks against OSV.dev database  
✅ Uses npm audit when applicable  
✅ Resolves all dependencies including transitive ones  
✅ Reports: vulnerable packages, versions, severity, CVE IDs, descriptions, advisory links  
✅ Suggests upgrades and remediations  
✅ Provides summary statistics  
✅ Accepts input via command line (positional args)  
✅ Outputs human-readable format to console  
✅ Outputs JSON format (with --json flag)  

## Next Steps

1. **Install dependencies**: `npm install`
2. **Build**: `npm run build`
3. **Test**: `./bin/security-checker examples/test-package.json`
4. **Use with your project**: `./bin/security-checker package-lock.json`
