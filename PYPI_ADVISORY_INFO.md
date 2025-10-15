# PyPI Advisory Database Integration

## Overview

The security-checker tool integrates with the **Python Packaging Advisory Database** (PyPA Advisory Database) to provide comprehensive vulnerability coverage for Python packages. This database is specifically maintained for Python packages and complements OSV.dev.

## What is the PyPI Advisory Database?

The PyPI Advisory Database is:
- **Source**: https://github.com/pypa/advisory-database
- **Maintained by**: Python Packaging Authority (PyPA)
- **Focus**: Python-specific security vulnerabilities
- **Format**: Structured JSON advisories following OSV schema
- **Coverage**: Curated vulnerabilities affecting PyPI packages

## Integration Details

### Access Method

The tool accesses the advisory database through two methods:

1. **PyPI JSON API** (Primary)
   - Endpoint: `https://pypi.org/pypi/{package}/{version}/json`
   - Includes vulnerability information in newer PyPI versions
   - Fast and direct access

2. **GitHub API** (Fallback)
   - Accesses raw advisory files from the GitHub repository
   - Path: `https://api.github.com/repos/pypa/advisory-database/contents/vulns/{package}`
   - Comprehensive coverage of all advisories

### How It Works

```typescript
// For each Python package:
1. Query PyPI JSON API for vulnerability info
2. Query PyPA Advisory Database via GitHub API
3. Check if package version is affected by advisory
4. Extract CVE IDs, severity, and fixed versions
5. Return structured vulnerability reports
```

### Example Advisory Structure

```json
{
  "id": "PYSEC-2021-123",
  "aliases": ["CVE-2021-12345", "GHSA-xxxx-xxxx-xxxx"],
  "summary": "SQL injection in Django admin",
  "details": "Detailed description of the vulnerability...",
  "affected": [
    {
      "package": {
        "name": "django",
        "ecosystem": "PyPI"
      },
      "ranges": [
        {
          "type": "ECOSYSTEM",
          "events": [
            { "introduced": "2.2.0" },
            { "fixed": "2.2.10" }
          ]
        }
      ]
    }
  ],
  "references": [
    {
      "type": "ADVISORY",
      "url": "https://www.djangoproject.com/weblog/2020/feb/03/security-releases/"
    }
  ],
  "database_specific": {
    "severity": "HIGH",
    "cwe_ids": ["CWE-89"]
  }
}
```

## Benefits of PyPI Advisory Database

### 1. Python-Specific Focus
- Curated specifically for Python ecosystem
- Maintained by Python packaging experts
- Deep understanding of Python package vulnerabilities

### 2. Complementary Coverage
- Works alongside OSV.dev for comprehensive scanning
- May include advisories not yet in other databases
- Python community-driven updates

### 3. Detailed Information
- Specific version ranges affected
- CWE (Common Weakness Enumeration) IDs
- Links to official package security advisories
- Severity ratings

### 4. No Authentication Required
- Public API access
- No rate limits for reasonable usage
- Easy integration

## Vulnerability Report Format

Each vulnerability found includes:

```typescript
{
  package: "django",
  version: "2.2.0",
  severity: "HIGH",
  description: "SQL injection vulnerability in Django admin",
  cveIds: ["CVE-2021-12345"],
  advisoryLinks: [
    "https://www.djangoproject.com/weblog/2020/feb/03/security-releases/",
    "https://github.com/pypa/advisory-database/tree/main/vulns/django/PYSEC-2021-123.json"
  ],
  fixedVersions: ["2.2.10"],
  suggestedUpgrade: "2.2.10",
  source: "PYPI"
}
```

## Multi-Source Python Scanning

For Python packages, the tool now checks **two sources**:

### OSV.dev
- Broad coverage across multiple ecosystems
- Aggregates data from various sources
- CVSS scoring
- Machine-readable format

### PyPI Advisory Database
- Python-specific advisories
- Community-maintained
- Detailed Python package information
- May include additional Python-specific vulnerabilities

### Deduplication

The tool deduplicates vulnerabilities by `package@version`:
- If both sources report the same vulnerability, only one is shown
- First source found takes priority (prevents duplicate reports)
- Provides comprehensive coverage without redundancy

## Performance Considerations

### Batching
- Checks packages in batches of 5 to avoid API overload
- Caches results within a scan session
- Efficient for large dependency trees

### Caching
- Results cached per package@version within a scan
- Reduces redundant API calls
- Improves performance for projects with duplicate dependencies

### Error Handling
- Gracefully handles API failures
- Falls back to other sources if one fails
- Continues scanning even if some packages fail

## Example Output

### Human-Readable

```
🔍 Checking for vulnerabilities...
  Checking 87 Python packages with OSV.dev...
  Checking 87 Python packages with PyPI Advisory Database...

🚨 Vulnerabilities Details

  [CRITICAL] django@2.2.0
    SQL injection vulnerability in Django admin
    CVE IDs: CVE-2020-7471
    Fix available: Upgrade to 2.2.10
    Source: PYPI

  [HIGH] requests@2.25.0
    Server-side request forgery (SSRF) vulnerability
    CVE IDs: CVE-2021-43818
    Fix available: Upgrade to 2.27.1
    Source: PYPI
```

### JSON Output

```json
{
  "vulnerabilities": [
    {
      "package": "django",
      "version": "2.2.0",
      "severity": "CRITICAL",
      "description": "SQL injection vulnerability in Django admin",
      "cveIds": ["CVE-2020-7471"],
      "advisoryLinks": [
        "https://www.djangoproject.com/weblog/2020/feb/03/security-releases/",
        "https://github.com/pypa/advisory-database/tree/main/vulns/django/PYSEC-2021-123.json"
      ],
      "fixedVersions": ["2.2.10"],
      "suggestedUpgrade": "2.2.10",
      "source": "PYPI"
    }
  ]
}
```

## Comparison: OSV.dev vs PyPI Advisory Database

| Feature | OSV.dev | PyPI Advisory Database |
|---------|---------|------------------------|
| Ecosystem Coverage | Multi-ecosystem | Python-only |
| Maintainer | Google | Python Packaging Authority |
| Data Sources | Aggregated | Curated |
| Update Frequency | Continuous | Community-driven |
| CVSS Scores | Yes | Limited |
| Python-Specific Details | Good | Excellent |
| Authentication | Not required | Not required |

## Best Practices

### ✅ DO:
- Use lock files (poetry.lock, Pipfile.lock) for complete coverage
- Run scans regularly in CI/CD
- Review all sources of vulnerabilities
- Update dependencies when fixes are available

### ⚠️ CONSIDER:
- PyPI Advisory Database may have different coverage than OSV.dev
- Some vulnerabilities may only appear in one source
- Cross-reference multiple sources for critical packages
- Check advisory links for additional context

## Troubleshooting

### No PyPI vulnerabilities found

This is normal if:
- Packages are up-to-date
- Vulnerabilities are only in OSV.dev
- Package not in PyPI Advisory Database

### API rate limiting

- Tool uses batching (5 packages at a time)
- Caching reduces repeated requests
- GitHub API has rate limits (60 req/hour unauthenticated)

### Advisory parsing errors

- Tool gracefully handles parsing errors
- Continues scanning remaining packages
- Verbose mode shows detailed error information

## Technical Implementation

### Service Architecture

```typescript
class PyPIAdvisoryService {
  // Check via PyPI JSON API
  async checkPyPIAPI(packageName, version)
  
  // Check via GitHub Advisory Database
  async checkPyPAAdvisories(packageName, version)
  
  // Batch checking
  async batchCheck(packages)
  
  // Version affected checking
  isVersionAffected(advisory, version)
}
```

### Integration Flow

```
Python Package Detection
    ↓
OSV.dev Query → Results
    ↓
PyPI Advisory Query → Results
    ↓
Deduplication by package@version
    ↓
Combined Report
```

## Summary

The PyPI Advisory Database integration provides:
- ✅ Python-specific vulnerability coverage
- ✅ Community-maintained advisories
- ✅ Complements OSV.dev for comprehensive scanning
- ✅ No authentication required
- ✅ Detailed vulnerability information
- ✅ Automatic deduplication
- ✅ Batch processing for performance

Together with OSV.dev, this provides **best-in-class Python security scanning** for both direct and transitive dependencies.

