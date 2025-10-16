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

