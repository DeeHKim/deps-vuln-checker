# Implementation Notes

## Architecture Overview

This security checker tool is built with a modular architecture that separates concerns:

### Core Components

1. **CLI Layer** (`src/cli.ts`)
   - Handles argument parsing
   - Implements lock file priority logic
   - Auto-detects file types from positional arguments

2. **Parser Layer** (`src/parsers/`)
   - Each parser handles a specific file format
   - Extracts dependency information including transitive dependencies
   - Lock file parsers capture full dependency trees

3. **Service Layer** (`src/services/`)
   - `NpmRegistryService`: Queries npm Registry Audit API directly
   - `OSVService`: Queries OSV.dev API for vulnerability data
   - `PyPIAdvisoryService`: Queries PyPI Advisory Database for Python packages

4. **Checker Layer** (`src/checkers/`)
   - Orchestrates vulnerability scanning across all services
   - Deduplicates results from multiple sources
   - Aggregates statistics and generates reports

5. **Utilities** (`src/utils/`)
   - Logger with colored output
   - Type definitions for strong typing

## Key Features Implementation

### 1. Lock File Priority

Implemented in `src/cli.ts`:
```typescript
export function prioritizeFiles(options: CLIOptions): CLIOptions {
  // If both package.json and lock files exist, remove package.json
  if (options.packageJson && options.packageLock) {
    options.packageJson = undefined;
  }
  // Similar logic for yarn.lock and Pipfile.lock
}
```

### 2. Transitive Dependency Resolution

Lock files naturally include transitive dependencies:
- **package-lock.json**: Contains entire dependency tree in `dependencies` or `packages` field
- **yarn.lock**: Contains all resolved packages with exact versions
- **Pipfile.lock**: Contains complete dependency graph with hashes

### 3. Multi-Source Vulnerability Checking

Checks run in parallel for efficiency:
```typescript
// npm Registry API for npm packages
const npmRegistryResults = await this.checkNpmPackagesRegistry(npmPackages);

// OSV.dev for all package types
const osvResults = await this.checkNpmPackagesOSV(npmPackages);


// PyPI Advisory Database for Python packages
const pypiResults = await this.checkPythonPackagesPyPI(pythonPackages);
```

Results are deduplicated using a Map keyed by `package@version`.

### 4. Comprehensive Reporting

Reports include:
- CVE IDs extracted from vulnerability data
- Advisory links from references
- Fixed versions from range information
- Suggested upgrades (usually the first fixed version)
- Severity calculated from CVSS scores

## API Integration Details

### OSV.dev API

- Endpoint: `https://api.osv.dev/v1/query`
- Method: POST
- Authentication: None required
- Rate Limits: Reasonable usage (10 req/sec per IP)
- Batch processing implemented to stay within limits

Request format:
```json
{
  "package": {
    "name": "lodash",
    "ecosystem": "npm"
  },
  "version": "4.17.15"
}
```

- Method: POST (GraphQL)
- Authentication: Bearer token required
- Rate Limits: 5000 points/hour with token

Query:
```graphql
query($ecosystem: SecurityAdvisoryEcosystem!, $package: String!) {
  securityVulnerabilities(first: 100, ecosystem: $ecosystem, package: $package) {
    nodes {
      advisory { ... }
      package { ... }
      vulnerableVersionRange
      firstPatchedVersion { identifier }
    }
  }
}
```

### npm Registry Audit API

- Endpoint: `https://registry.npmjs.org/-/npm/v1/security/audits`
- Method: POST
- Package: npm-registry-fetch
- No CLI required
- Direct API access for faster scanning

## Error Handling

The tool is designed to be resilient:
- API failures return empty arrays instead of throwing
- npm audit failures are logged but don't stop other checks
- File not found errors are caught and reported clearly

## Performance Considerations

### Batching
- OSV queries are batched (10 at a time) to avoid rate limits

### Parallelization
- npm Registry, OSV, and PyPI checks run concurrently where possible
- Multiple file parsing happens sequentially but fast

### Deduplication
- Results stored in Map by package@version
- Prevents duplicate vulnerability reports
- Deduplication by CVE ID ensures unique vulnerability reporting

## Future Improvements

1. **Caching**: Cache API responses to disk for repeated scans
2. **Offline Mode**: Support for offline vulnerability databases
3. **SBOM Support**: Export/import SPDX or CycloneDX formats
4. **More Ecosystems**: Maven, Gradle, Cargo, Go modules
5. **Fix Automation**: Automatically apply suggested upgrades
6. **Continuous Monitoring**: Watch mode for dependency changes
7. **Custom Policies**: User-defined severity thresholds

## Testing Strategy

For production use, implement:
- Unit tests for each parser
- Integration tests for API services
- E2E tests with fixture files
- Mock API responses for consistent testing

Example test structure:
```
tests/
  ├── parsers/
  │   ├── packageJson.test.ts
  │   ├── yarnLock.test.ts
  │   └── fixtures/
  ├── services/
  │   ├── osvService.test.ts
  │   └── mocks/
  └── integration/
      └── cli.test.ts
```
