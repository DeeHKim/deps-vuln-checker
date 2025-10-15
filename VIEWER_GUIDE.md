# Web Viewer Guide

## Overview

The Security Checker Web Viewer is a standalone HTML file that provides an interactive, visual interface for exploring vulnerability scan results.

## Features

### 📊 Summary Dashboard
- **Total Dependencies**: Number of packages scanned
- **Vulnerable Packages**: Count of packages with vulnerabilities
- **Total Vulnerabilities**: Aggregate vulnerability count
- **Vulnerability Percentage**: Percentage of packages affected
- **Severity Breakdown**: Visual badges showing count by severity

### 🔍 Search & Filter
- **Package Search**: Real-time search by package name
- **Severity Filter**: Filter by Critical, High, Moderate, Low, or Unknown
- **Source Filter**: Filter by vulnerability source (OSV, npm Registry, PyPI)
- **Multiple Filters**: Combine search with severity and source filters

### 📑 Sort Options
- **By Severity**: Critical → High → Moderate → Low → Unknown (default)
- **By Package Name**: Alphabetical A-Z
- **By Source**: Group by vulnerability database

### 🎨 Visual Design
- **Color-Coded Cards**: Each vulnerability has a colored left border
  - 🔴 Red = Critical
  - 🟠 Orange = High
  - 🟡 Yellow = Moderate
  - 🟢 Green = Low
  - ⚪ Gray = Unknown
- **Severity Badges**: Prominent severity indicators
- **Source Tags**: Shows which database found the issue
- **CVE Badges**: Highlighted CVE identifiers
- **Hover Effects**: Interactive card animations

### 🔗 Direct Links
- **Advisory Links**: Click-through to vulnerability details
- **External References**: Opens in new tab
- **Multiple Advisories**: Shows up to 3 advisory links per vulnerability

### 💊 Fix Information
- **Upgrade Suggestions**: Green boxes showing recommended versions
- **Version Information**: Current and fixed versions displayed
- **Fix Availability**: Clear indicators when patches exist

## Usage

### Step 1: Generate JSON Report

Run security-checker with the `--json` flag:

```bash
# Check npm packages
security-checker package-lock.json --json report.json

# Check Python packages
security-checker requirements.txt --json python-report.json

# With ignore list
security-checker package.json --ignore .securityignore.json --json filtered-report.json
```

### Step 2: Open the Viewer

Open `viewer.html` in any modern web browser:

**macOS:**
```bash
open viewer.html
```

**Windows:**
```bash
start viewer.html
```

**Linux:**
```bash
xdg-open viewer.html
```

**Or:** Simply double-click `viewer.html` in your file explorer.

### Step 3: Load Your Report

Two methods to load your JSON report:

**Method 1: Click to Browse**
1. Click the upload box in the center of the page
2. Navigate to your JSON file
3. Select and open

**Method 2: Drag and Drop**
1. Drag your JSON file from file explorer
2. Drop it onto the upload box
3. Report loads automatically

### Step 4: Explore Vulnerabilities

**View Summary:**
- Top section shows key metrics
- Severity breakdown with color-coded badges
- At-a-glance understanding of your security posture

**Search:**
- Type package name in "Search Package" field
- Real-time filtering as you type
- Case-insensitive matching

**Filter by Severity:**
- Select dropdown: All, Critical, High, Moderate, Low, Unknown
- Instantly shows only matching vulnerabilities
- Combine with search for precise results

**Filter by Source:**
- Choose: All Sources, OSV, npm Registry, PyPI
- See which database found specific issues
- Useful for understanding coverage

**Sort Results:**
- Default: Severity (highest first)
- By Package Name: Alphabetical listing
- By Source: Group by vulnerability database

## Example Workflows

### Workflow 1: Focus on Critical Issues

1. Generate report: `security-checker package-lock.json --json report.json`
2. Open viewer: `open viewer.html`
3. Load `report.json`
4. Set "Filter by Severity" → **Critical**
5. Address these issues first

### Workflow 2: Check Specific Package

1. Load your JSON report
2. Type package name in search (e.g., "lodash")
3. See all vulnerabilities for that package
4. Click advisory links for details

### Workflow 3: Compare Sources

1. Load report
2. Filter by "OSV" → note count
3. Filter by "npm Registry" → note count
4. Filter by "PyPI" → note count
5. Understand which sources provide most coverage

### Workflow 4: Progressive Remediation

**Week 1:**
- Filter: Severity = Critical
- Fix all critical issues
- Generate new report

**Week 2:**
- Filter: Severity = High
- Fix high severity issues
- Generate new report

**Week 3:**
- Filter: Severity = Moderate
- Address moderate issues
- Repeat as needed

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

**No server required** - runs entirely in the browser using JavaScript.

## Technical Details

### File Structure

The viewer is a single HTML file containing:
- HTML structure
- Embedded CSS styles
- Embedded JavaScript logic

### Data Format

Expects JSON in this format:

```json
{
  "summary": {
    "totalDependencies": 100,
    "vulnerablePackages": 15,
    "vulnerabilitiesFound": 23,
    "percentageVulnerable": 15.0,
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
      "description": "Vulnerability description",
      "cveIds": ["CVE-2020-8203"],
      "advisoryLinks": ["https://..."],
      "suggestedUpgrade": "4.17.21",
      "source": "OSV"
    }
  ]
}
```

### Privacy & Security

- **No data transmission**: All processing happens locally
- **No external dependencies**: Self-contained HTML file
- **No tracking**: No analytics or telemetry
- **Offline capable**: Works without internet connection after loading

## Tips & Best Practices

### Performance
- The viewer handles reports with 1000+ vulnerabilities smoothly
- Filtering and sorting are instant
- Scrolling is optimized for large lists

### Sharing Reports
- JSON files are portable and shareable
- Send `viewer.html` + `report.json` to teammates
- No installation required for recipients

### Regular Scanning
- Generate reports weekly/monthly
- Compare counts over time manually
- Track remediation progress

### CI/CD Integration
- Generate JSON in CI pipeline
- Archive as build artifact
- Download and view locally

### Custom Styling
- The viewer is a single HTML file
- Edit CSS styles to match your brand
- Modify colors, fonts, layouts as needed

## Keyboard Shortcuts

While using the viewer:
- **Tab**: Navigate between filter controls
- **Enter**: Apply filter/search
- **Esc**: Clear search (when focused)
- **Ctrl/Cmd + F**: Browser find for searching within descriptions

## Troubleshooting

### "Error parsing JSON file"
- Ensure the file is valid JSON
- Check the file was generated by security-checker
- Try regenerating the report

### No vulnerabilities showing
- Check your filters - may be too restrictive
- Verify JSON contains vulnerabilities array
- Try "All Severities" and "All Sources"

### Upload not working
- File must have `.json` extension
- Try click-to-browse instead of drag-drop
- Check browser console for errors

### Styling looks broken
- Ensure you're using a modern browser
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Check browser console for errors

## Future Enhancements

Potential features for future versions:
- Export filtered results to new JSON
- Print-friendly view
- PDF export
- Compare multiple reports
- Trend charts over time
- Direct package.json patch generation

## Contributing

The viewer is open for improvements:
- Submit issues for bugs
- Propose features
- Contribute UI enhancements
- Share custom themes

## License

Same license as security-checker (MIT)

