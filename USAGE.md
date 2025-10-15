# Usage Guide

## Quick Start

After building the project:

```bash
npm install
npm run build
```

## Testing the CLI

### Test with example files

```bash
# Test with the example package.json
./bin/security-checker examples/test-package.json

# Test with Python requirements
./bin/security-checker examples/test-requirements.txt

# Test with Python poetry.lock
./bin/security-checker examples/test-poetry.lock

# Test with both
./bin/security-checker examples/test-package.json examples/test-requirements.txt
```

### Test with your own project files

```bash
# Scan your package-lock.json (includes all transitive dependencies)
./bin/security-checker package-lock.json

# Scan Python with poetry.lock (includes all transitive dependencies)
./bin/security-checker poetry.lock

# Scan with verbose output
./bin/security-checker package-lock.json --verbose

# Get JSON output
./bin/security-checker package-lock.json --json

# Scan multiple file types
./bin/security-checker package-lock.json requirements.txt
```

## Command Line Options

### Positional Arguments (Recommended)

The simplest way to use the tool is with positional arguments:

```bash
security-checker <file1> [file2] [file3] ...
```

Examples:
```bash
security-checker package-lock.json
security-checker yarn.lock
security-checker package.json package-lock.json  # Lock file takes priority
security-checker requirements.txt Pipfile.lock   # Lock file takes priority
security-checker requirements.txt poetry.lock    # Lock file takes priority
security-checker poetry.lock                     # Best for Python projects
```

### Named Options

You can also specify files using named options:

```bash
security-checker --package-json ./package.json
security-checker --package-lock ./package-lock.json
security-checker --yarn-lock ./yarn.lock
security-checker --requirements-txt ./requirements.txt
security-checker --pipfile-lock ./Pipfile.lock
security-checker --poetry-lock ./poetry.lock
```

### Output Options

```bash
# Human-readable output (default)
security-checker package-lock.json

# JSON output for CI/CD or further processing
security-checker package-lock.json --json

# Verbose output (includes advisory URLs)
security-checker package-lock.json --verbose

# Combine flags
security-checker package-lock.json --json --verbose
```


## Understanding the Output

### Human-Readable Format

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
    npm install axios@0.21.2
```

### JSON Format

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

## Lock File Priority Behavior

The tool automatically prioritizes lock files over manifest files because they:
1. Contain exact versions (not ranges)
2. Include all transitive dependencies
3. Represent the actual installed packages

### Priority Rules

| Files Provided | File Used |
|----------------|-----------|
| `package.json` only | `package.json` |
| `package-lock.json` only | `package-lock.json` |
| `package.json` + `package-lock.json` | `package-lock.json` (manifest ignored) |
| `yarn.lock` only | `yarn.lock` |
| `package.json` + `yarn.lock` | `yarn.lock` (manifest ignored) |
| `requirements.txt` only | `requirements.txt` |
| `Pipfile.lock` only | `Pipfile.lock` |
| `poetry.lock` only | `poetry.lock` |
| `requirements.txt` + `Pipfile.lock` | `Pipfile.lock` (requirements ignored) |
| `requirements.txt` + `poetry.lock` | `poetry.lock` (requirements ignored) |
| `Pipfile.lock` + `poetry.lock` | Both (different tools) |

## Python-Specific Notes

### Transitive Dependency Resolution

For Python projects, **use lock files** for complete transitive dependency scanning:

- **poetry.lock**: Contains all transitive dependencies with exact versions and hashes
- **Pipfile.lock**: Contains all transitive dependencies with exact versions and hashes
- **requirements.txt**: Only direct dependencies (no transitive resolution)

### Best Practices for Python

```bash
# ✅ RECOMMENDED: Use lock files
security-checker poetry.lock         # Poetry projects
security-checker Pipfile.lock        # Pipenv projects

# ⚠️  LIMITED: requirements.txt only scans direct dependencies
security-checker requirements.txt

# ✅ BEST: Combine lock file with requirements.txt
# (lock file will be prioritized, requirements.txt ignored)
security-checker requirements.txt poetry.lock
```

If you are using requirements.txt file for pip dependencies without a lockfile and want transitive
dependencies checked as well, use pip freeze after installing your dependencies before running
security checker: 

Have a commented requirements.txt file with your main dependencies:
Install your dependencies: ```pip install -r requirements.txt```. Now you get the full list of your dependencies(including transitive) with ```pip freeze -r requirements.txt```

### Poetry Projects

For Poetry-based Python projects:
```bash
# Generate poetry.lock if not present
poetry lock

# Scan for vulnerabilities
security-checker poetry.lock
```

### Pipenv Projects

For Pipenv-based Python projects:
```bash
# Generate Pipfile.lock if not present
pipenv lock

# Scan for vulnerabilities
security-checker Pipfile.lock
```

## Exit Codes

- **0**: No vulnerabilities found
- **1**: Vulnerabilities found OR error occurred

Use in CI/CD:
```bash
security-checker package-lock.json
if [ $? -eq 0 ]; then
  echo "No vulnerabilities found!"
else
  echo "Vulnerabilities detected!"
  exit 1
fi
```

## Integration Examples

### GitHub Actions

```yaml
name: Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: ./bin/security-checker package-lock.json
        env:
```

### Python Project CI

```yaml
name: Python Security Check
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - uses: actions/setup-node@v3
      - run: npm install -g security-checker
      - run: security-checker poetry.lock --json > security-report.json
      - uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.json
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running security check..."
./bin/security-checker package-lock.json --json > /tmp/security-report.json

if [ $? -ne 0 ]; then
  echo "⚠️  Security vulnerabilities detected!"
  echo "Review the report and consider updating dependencies."
  # Optionally fail the commit
  # exit 1
fi
```

### npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "security-check": "security-checker package-lock.json",
    "security-check:json": "security-checker package-lock.json --json",
    "security-check:verbose": "security-checker package-lock.json --verbose"
  }
}
```

Then run:
```bash
npm run security-check
```

## Troubleshooting

### "File not found" error

Ensure the file path is correct and the file exists:
```bash
ls -la package-lock.json
./bin/security-checker package-lock.json
```


### npm audit fails

Ensure npm is installed and in your PATH:
```bash
which npm
npm --version
```

### Poetry.lock parsing issues

Ensure your poetry.lock file is valid:
```bash
poetry check
```

### Rate limiting

If you're scanning many packages, you may hit rate limits on OSV.dev. The tool handles this gracefully but some results may be missing. Solutions:
- Run the scan less frequently
- Scan smaller batches of dependencies
- Wait a few minutes and retry

## Advanced Usage

### Scanning Multiple Projects

```bash
# Scan multiple projects
for dir in project1 project2 project3; do
  echo "Scanning $dir..."
  ./bin/security-checker $dir/package-lock.json --json > reports/$dir-report.json
done
```

### Filtering JSON Results

```bash
# Get only critical vulnerabilities
./bin/security-checker package-lock.json --json | \
  jq '.vulnerabilities[] | select(.severity == "CRITICAL")'

# Count vulnerabilities by severity
./bin/security-checker package-lock.json --json | \
  jq '.summary.bySeverity'

# List all vulnerable packages
./bin/security-checker package-lock.json --json | \
  jq '.vulnerabilities[].package' | sort | uniq
```

### Comparing Scans Over Time

```bash
# Save baseline
./bin/security-checker package-lock.json --json > baseline.json

# After updates, compare
./bin/security-checker package-lock.json --json > current.json
diff baseline.json current.json
```

### Multi-Ecosystem Projects

For projects using both JavaScript and Python:

```bash
# Scan both ecosystems at once
security-checker package-lock.json poetry.lock --json
```
