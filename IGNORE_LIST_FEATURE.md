# Ignore List Feature

## Overview

The `--ignore` flag allows you to suppress specific vulnerabilities from scan results based on CVE IDs or severity levels.

## Usage

```bash
security-checker <files> --ignore <path-to-ignore-list.json>
```

## Ignore List Format

Create a JSON file with the following structure:

```json
{
  "cveIds": ["CVE-2022-28346", "CVE-2021-23337"],
  "severityIgnore": ["LOW", "MODERATE"]
}
```

### Keys

- **`cveIds`** (optional): Array of CVE ID strings to ignore
  - Any vulnerability containing a matching CVE ID will be filtered out
  - Example: `["CVE-2022-28346", "CVE-2021-23337"]`

- **`severityIgnore`** (optional): Array of severity levels to ignore
  - Valid values: `"LOW"`, `"MODERATE"`, `"HIGH"`, `"CRITICAL"`, `"UNKNOWN"`
  - All vulnerabilities matching these severity levels will be filtered out
  - Example: `["LOW", "MODERATE"]`

Both keys are optional, but at least one should be provided for the ignore list to have any effect.

## Examples

### Example 1: Ignore LOW and MODERATE Vulnerabilities

**`.securityignore.json`:**
```json
{
  "severityIgnore": ["LOW", "MODERATE"]
}
```

**Command:**
```bash
security-checker package-lock.json --ignore .securityignore.json
```

**Result:** Only HIGH and CRITICAL vulnerabilities will be reported.

### Example 2: Ignore Specific CVEs

**`.securityignore.json`:**
```json
{
  "cveIds": [
    "CVE-2022-28346",
    "CVE-2021-23337",
    "CVE-2020-8203"
  ]
}
```

**Command:**
```bash
security-checker requirements.txt --ignore .securityignore.json
```

**Result:** Vulnerabilities with these specific CVE IDs will be suppressed.

### Example 3: Combined Filtering

**`.securityignore.json`:**
```json
{
  "cveIds": ["CVE-2022-28346"],
  "severityIgnore": ["LOW"]
}
```

**Command:**
```bash
security-checker package-lock.json --ignore .securityignore.json --verbose
```

**Result:** 
- Vulnerabilities with CVE-2022-28346 are filtered out
- All LOW severity vulnerabilities are filtered out
- Verbose mode shows which vulnerabilities were ignored

## Behavior

### Filtering Logic

1. **CVE ID Matching**: If a vulnerability has ANY CVE ID that matches the ignore list, it is filtered out
2. **Severity Matching**: If a vulnerability's severity level matches the ignore list, it is filtered out
3. **OR Logic**: A vulnerability is filtered if it matches EITHER the CVE list OR severity list

### Verbose Output

When using `--verbose` with an ignore list:

```bash
security-checker package-lock.json --ignore .securityignore.json --verbose
```

You'll see debug messages like:
```
🔍 Loaded ignore list from .securityignore.json
🔍   Ignoring 3 CVE ID(s)
🔍   Ignoring severity level(s): LOW, MODERATE
...
🔍 Ignoring lodash@4.17.15 due to CVE filter: CVE-2020-8203
🔍 Ignoring axios@0.21.0 due to severity filter: LOW
🔍 Filtered out 5 vulnerabilities based on ignore list
```

### Summary Statistics

The summary statistics reflect **only non-ignored vulnerabilities**:

```
📊 Results Summary
  Total dependencies scanned: 100
  Vulnerable packages: 5 (5.0%)    # After filtering
  Total vulnerabilities: 8         # After filtering
  
  Severity breakdown:
    🔴 Critical: 2
    🟠 High: 6
    🟡 Moderate: 0  # Filtered out
    🟢 Low: 0       # Filtered out
```

### Exit Codes

- Exit code `0`: No vulnerabilities found (after filtering)
- Exit code `1`: Vulnerabilities found (after filtering) OR error occurred

## Real-World Use Cases

### 1. Focus on Critical Issues
Ignore LOW and MODERATE to focus development effort on critical vulnerabilities:

```json
{
  "severityIgnore": ["LOW", "MODERATE"]
}
```

### 2. Suppress Known False Positives
Ignore specific CVEs that don't apply to your use case:

```json
{
  "cveIds": ["CVE-2022-XXXXX"]
}
```

### 3. Gradual Remediation
Start by fixing CRITICAL, then HIGH, progressively ignoring lower severities:

**Phase 1:**
```json
{
  "severityIgnore": ["LOW", "MODERATE", "HIGH"]
}
```

**Phase 2:**
```json
{
  "severityIgnore": ["LOW", "MODERATE"]
}
```

**Phase 3:**
```json
{
  "severityIgnore": ["LOW"]
}
```

### 4. CI/CD Integration
Fail builds only for HIGH and CRITICAL:

```yaml
- name: Security Check
  run: |
    security-checker package-lock.json --ignore .ci-ignore.json
```

**`.ci-ignore.json`:**
```json
{
  "severityIgnore": ["LOW", "MODERATE"]
}
```

## Error Handling

### File Not Found
```bash
$ security-checker package.json --ignore missing.json
❌ Ignore list file not found: missing.json
```

### Invalid JSON
```bash
$ security-checker package.json --ignore invalid.json
❌ Failed to parse ignore list: Unexpected token in JSON at position 10
```

### Invalid Format
If the ignore list doesn't match the expected format, it will simply not filter anything (graceful degradation).

## Best Practices

1. **Version Control**: Commit your ignore list to version control
2. **Documentation**: Comment in your ignore list why specific CVEs are ignored
3. **Regular Review**: Periodically review ignored vulnerabilities
4. **Team Alignment**: Ensure team agrees on what's being suppressed
5. **Separate Lists**: Use different ignore lists for different environments (dev, staging, prod)

## Technical Details

### Implementation

- Filtering happens **after** all vulnerability checks complete
- Deduplication occurs **before** filtering
- Original vulnerability count is logged in verbose mode
- Memory efficient: only stores unique vulnerabilities

### Performance

- No performance impact during scanning
- Minimal filtering overhead (O(n) where n = number of vulnerabilities)
- JSON parsing happens once at startup

## Testing

Test the ignore list with a known vulnerable package:

```bash
# See all vulnerabilities
security-checker examples/requirements.txt --verbose

# See filtered vulnerabilities
security-checker examples/requirements.txt --ignore examples/.securityignore.json --verbose
```

Compare the outputs to verify filtering is working correctly.

