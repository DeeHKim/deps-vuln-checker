# Security Checker

A comprehensive command-line tool to check pip and NPM dependencies for security vulnerabilities across multiple package managers. Integrates with **npm Registry Audit API**, **OSV.dev**, and **PyPI Advisory Database** to provide thorough vulnerability scanning.

## 🔍 Features

- ✅ **Multi-Database Scanning**: Checks against npm Registry API, OSV.dev, and PyPI Advisory Database
- ✅ **Transitive Dependencies**: Resolves and scans all transitive dependencies from lock files
- ✅ **Multiple Package Managers**: npm, Yarn, pip
- ✅ **Smart Lock File Priority**: Automatically prioritizes lock files over manifest files for accurate results
- ✅ **Comprehensive Reports**: CVE IDs, severity levels, advisory links, and remediation suggestions
- ✅ **Dual Output Formats**: Human-readable console output and machine-readable JSON

## Supported Package Managers

### JavaScript/Node.js
- **package.json** - npm manifest
- **package-lock.json** - npm lock file (includes transitive dependencies)
- **yarn.lock** - Yarn lock file (includes transitive dependencies)

### Python
- **requirements.txt** - pip requirements
- **Pipfile.lock** - Pipenv lock file (includes transitive dependencies)
- **poetry.lock** - Poetry lock file (includes transitive dependencies)

If you are using requirements.txt file for pip dependencies without a lockfile and want transitive
dependencies checked as well, use pip freeze after installing your dependencies before running
security checker: 

Have a commented requirements.txt file with your main dependencies:
Install your dependencies: ```pip install -r requirements.txt```. Now you get the full list of your dependencies(including transitive) with ```pip freeze -r requirements.txt```

## Installation

### Local Development

```bash
npm install
npm run build
```

### Global Installation

```bash
npm install -g .
```

or npm link (recommended for development)

```bash
npm link
```

## Usage

### Simple Usage (Positional Arguments)

The tool accepts files as positional arguments for convenience:

```bash
security-checker package-lock.json
security-checker yarn.lock requirements.txt
security-checker Pipfile.lock
security-checker poetry.lock
```

### Named Options Usage

You can also use named options:

```bash
security-checker --package-lock ./package-lock.json
security-checker --yarn-lock ./yarn.lock --requirements-txt ./requirements.txt
```

### Lock File Priority

When both manifest and lock files are provided, **lock files take priority** as they contain exact versions and transitive dependencies:

```bash
# Only package-lock.json will be used (package.json ignored)
security-checker package.json package-lock.json

# Only yarn.lock will be used
security-checker --package-json ./package.json --yarn-lock ./yarn.lock

# Only Pipfile.lock will be used (requirements.txt ignored)
security-checker requirements.txt Pipfile.lock

# Only poetry.lock will be used (requirements.txt ignored)
security-checker requirements.txt poetry.lock
```

## Output Formats

### Human-Readable Console Output

Default output provides a comprehensive, easy-to-read report:

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

  [HIGH] axios@0.21.0
    SSRF vulnerability in axios
    CVE IDs: CVE-2021-3749
    Fix available: Upgrade to 0.21.2

💡 Remediation Summary
  23 out of 23 vulnerabilities have fixes available.

  For npm/yarn packages:
    npm install lodash@4.17.21
    npm install axios@0.21.2
```

### JSON Output

Use `--json` for machine-readable output to console:

```bash
security-checker package-lock.json --json
```

Or save the JSON report to a file by providing a path:

```bash
# Save to a specific file
security-checker package-lock.json --json report.json

# Save to a custom path
security-checker package-lock.json --json ./reports/security-audit.json
```

When outputting to a file, you'll see:
```
✅ JSON report written to: /path/to/report.json
```

### Web Viewer

Visualize your JSON reports in an interactive web interface:

```bash
# Generate JSON report
security-checker package-lock.json --json report.json

# Open viewer.html in your browser and load the JSON file
open viewer.html
```

The web viewer provides:
- 📊 **Summary Dashboard** - Key metrics and severity breakdown
- 🔍 **Search & Filter** - Find vulnerabilities by package, severity, or source
- 📑 **Sort Options** - Sort by severity, package name, or source
- 🎨 **Color-Coded Display** - Visual severity indicators
- 🔗 **Direct Links** - Click through to advisory details
- 💊 **Fix Suggestions** - See available upgrades at a glance

![Viewer Features](viewer-screenshot.png)

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
  "vulnerabilities": [
    {
      "package": "lodash",
      "version": "4.17.15",
      "severity": "CRITICAL",
      "description": "Prototype Pollution vulnerability in lodash",
      "cveIds": ["CVE-2020-8203"],
      "advisoryLinks": ["https://osv.dev/vulnerability/GHSA-p6mc-m468-83gw"],
      "fixedVersions": ["4.17.21"],
      "suggestedUpgrade": "4.17.21",
      "source": "OSV"
    }
  ],
  "scannedFiles": [
    {
      "file": "package-lock.json",
      "type": "package-lock.json",
      "dependencyCount": 1247
    }
  ]
}
```

## Web Viewer Usage

The included `viewer.html` provides a beautiful web interface for analyzing security reports:

1. **Generate a JSON report:**
   ```bash
   security-checker package-lock.json --json report.json
   ```

2. **Open `viewer.html` in your browser:**
   - Double-click the file, or
   - `open viewer.html` (macOS)
   - `start viewer.html` (Windows)
   - `xdg-open viewer.html` (Linux)

3. **Load your JSON report:**
   - Click the upload box or drag and drop your JSON file

4. **Explore your vulnerabilities:**
   - View summary statistics
   - Filter by severity (Critical, High, Moderate, Low)
   - Filter by source (OSV, npm Registry, PyPI)
   - Search by package name
   - Sort by severity, package name, or source

## Options

| Option | Description |
|--------|-------------|
| `[files...]` | Dependency files to check (positional arguments) |
| `--package-json <path>` | Path to package.json file |
| `--package-lock <path>` | Path to package-lock.json file |
| `--yarn-lock <path>` | Path to yarn.lock file |
| `--requirements-txt <path>` | Path to requirements.txt file |
| `--pipfile-lock <path>` | Path to Pipfile.lock file |
| `--poetry-lock <path>` | Path to poetry.lock file |
| `--json [path]` | Output results as JSON (to console or file) |
| `-v, --verbose` | Enable verbose logging (includes advisory URLs) |
| `--ignore <path>` | Path to ignore list JSON file (CVE IDs and severities to suppress) |
| `--help` | Display help information |
| `--version` | Display version information |

## Ignoring Vulnerabilities

You can suppress specific vulnerabilities using an ignore list JSON file with the `--ignore` flag.

### Ignore List Format

Create a JSON file with the following structure:

```json
{
  "cveIds": ["CVE-2022-28346", "CVE-2021-23337"],
  "severityIgnore": ["LOW", "MODERATE"]
}
```

**Keys:**
- `cveIds` (optional): Array of CVE IDs to ignore
- `severityIgnore` (optional): Array of severity levels to ignore (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`, `UNKNOWN`)

### Usage

```bash
# Ignore specific CVEs and severity levels
security-checker package-lock.json --ignore .securityignore.json

# With verbose output to see what's being filtered
security-checker package-lock.json --ignore .securityignore.json --verbose
```

When using the ignore list:
- Vulnerabilities matching any CVE ID in the list will be suppressed
- Vulnerabilities matching any severity level in the list will be suppressed
- Filtered vulnerabilities are logged in verbose mode
- Summary statistics reflect only non-ignored vulnerabilities

## Environment Variables

No environment variables required. All APIs used are publicly accessible without authentication.

## Vulnerability Report Details

Each vulnerability report includes:

- **Package Name** - The vulnerable package
- **Version** - The installed version
- **Severity** - CRITICAL, HIGH, MODERATE, LOW, or UNKNOWN
- **Description** - Detailed description of the vulnerability
- **CVE IDs** - Common Vulnerabilities and Exposures identifiers
- **Advisory Links** - URLs to security advisories
- **Fixed Versions** - Versions that address the vulnerability
- **Suggested Upgrade** - Recommended version to upgrade to
- **Source** - Which database found the vulnerability (OSV, NPM_REGISTRY, PYPI)

## Project Structure

```
security-checker/
├── bin/
│   └── security-checker          # CLI executable
├── src/
│   ├── index.ts                  # Main entry point with enhanced reporting
│   ├── cli.ts                    # CLI argument parsing with priority logic
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── parsers/
│   │   ├── index.ts              # Parser orchestration
│   │   ├── packageJson.ts        # package.json parser
│   │   ├── packageLock.ts        # package-lock.json parser (transitive deps)
│   │   ├── yarnLock.ts           # yarn.lock parser (transitive deps)
│   │   ├── requirementsTxt.ts    # requirements.txt parser
│   │   ├── pipfileLock.ts        # Pipfile.lock parser (transitive deps)
│   │   └── poetryLock.ts         # poetry.lock parser (transitive deps)
│   ├── services/
│   │   ├── index.ts              # Service exports
│   │   ├── npmRegistryService.ts # npm Registry Audit API
│   │   ├── osvService.ts         # OSV.dev API integration
│   │   └── pypiAdvisoryService.ts # PyPI Advisory Database
│   ├── checkers/
│   │   ├── index.ts              # Checker exports
│   │   └── vulnerabilityChecker.ts  # Main vulnerability checking logic
│   └── utils/
│       └── logger.ts             # Enhanced logging with CVE display
├── package.json
├── tsconfig.json
├── viewer.html                  # Web UI for visualizing JSON reports
└── README.md
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Run Locally

```bash
npm start -- package-lock.json
npm start -- --yarn-lock ./yarn.lock --verbose
```

## How It Works

1. **File Parsing**: Parses dependency manifest or lock files
2. **Priority Logic**: If both manifest and lock files are provided, uses lock files (more accurate, includes transitive deps)
3. **Vulnerability Scanning**: Checks each dependency against:
   - **npm Registry API** - For npm packages, queries npm's audit API directly
   - **OSV.dev** - Comprehensive open-source vulnerability database
   - **PyPI Advisory Database** - Python-specific vulnerability database
4. **Deduplication**: Combines results from all sources, removing duplicates
5. **Reporting**: Generates comprehensive reports with remediation guidance

## Exit Codes

- `0` - Success, no vulnerabilities found
- `1` - Vulnerabilities found or error occurred

## API Integration Details

### OSV.dev
- Public API, no authentication required
- Supports npm, PyPI, Maven, Go, and more
- Provides CVSS scores and remediation info
- Rate limited to reasonable usage

### PyPI Advisory Database
- Python Packaging Advisory Database via GitHub
- Covers Python packages specifically
- Provides detailed vulnerability information for PyPI packages
- No authentication required
- Complements OSV.dev for comprehensive Python coverage

### npm Registry Audit API
- Direct API access to npm's vulnerability database
- No npm CLI required
- Fast and efficient batch checking
- Provides CVE IDs and fix suggestions
- Automatically run for all npm packages

## Example Workflows

### CI/CD Integration

```yaml
# .github/workflows/security-check.yml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g security-checker
      - run: security-checker package-lock.json --json security-report.json
      - uses: actions/upload-artifact@v2
        with:
          name: security-report
          path: security-report.json
```

### Local Development

```bash
# Check your project before committing
security-checker package-lock.json

# Check multiple ecosystems
security-checker package-lock.json requirements.txt

# Check Python with lock file (includes transitive dependencies)
security-checker poetry.lock

# Verbose output with all details
security-checker yarn.lock --verbose

# JSON output to console (for piping)
security-checker package-lock.json --json | jq '.summary'

# JSON output to file
security-checker package-lock.json --json security-report.json

# JSON output with timestamp
security-checker package-lock.json --json "report-$(date +%Y%m%d).json"

# Ignore LOW and MODERATE severity vulnerabilities
security-checker package-lock.json --ignore .securityignore.json

# Ignore specific CVEs
security-checker requirements.txt --ignore .securityignore.json --verbose

# Generate report and view in web UI
security-checker package-lock.json --json report.json && open viewer.html
```

## Limitations

- **Rate Limits**: OSV.dev has rate limits; large dependency trees may need retry logic
- **Network Required**: All vulnerability databases require internet connectivity

## Contributing

Contributions are welcome! Areas for improvement:

- Add more package managers (Maven, Gradle, Cargo, etc.)
- Implement caching for API responses
- Add vulnerability severity customization
- Support for SBOM (Software Bill of Materials) formats
- Offline mode with local vulnerability database

## License

MIT
