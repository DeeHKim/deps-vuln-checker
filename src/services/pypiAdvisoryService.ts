import axios from 'axios';
import { VulnerabilityReport } from '../types';

// PyPI JSON API endpoint
const PYPI_JSON_API = 'https://pypi.org/pypi';

// Python Packaging Advisory Database
// The advisories are available via GitHub API
const PYPI_ADVISORY_API = 'https://api.github.com/repos/pypa/advisory-database/contents/vulns';

interface PyPIPackageInfo {
  info: {
    name: string;
    version: string;
    vulnerabilities?: Array<{
      id: string;
      details: string;
      fixed_in?: string[];
      link?: string;
      aliases?: string[];
    }>;
  };
  vulnerabilities?: Array<{
    id: string;
    details: string;
    fixed_in?: string[];
    link?: string;
    aliases?: string[];
  }>;
}

interface PyPAAdvisory {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
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
  database_specific?: {
    severity?: string;
    cwe_ids?: string[];
  };
}

export class PyPIAdvisoryService {
  private cache: Map<string, VulnerabilityReport[]> = new Map();

  async checkPackage(packageName: string, version: string): Promise<VulnerabilityReport[]> {
    // Skip if version is missing or invalid
    if (!version || version.trim() === '') {
      return [];
    }

    const cacheKey = `${packageName}@${version}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const vulnerabilities: VulnerabilityReport[] = [];

    // Try PyPI JSON API first (newer PyPI versions include vulnerability info)
    try {
      const pypiVulns = await this.checkPyPIAPI(packageName, version);
      vulnerabilities.push(...pypiVulns);
    } catch (error) {
      // PyPI API may not have vulnerability data for all packages
    }

    // Check PyPA Advisory Database via GitHub API
    try {
      const pypaVulns = await this.checkPyPAAdvisories(packageName, version);
      vulnerabilities.push(...pypaVulns);
    } catch (error) {
      // Advisory database may not have data for this package
    }

    this.cache.set(cacheKey, vulnerabilities);
    return vulnerabilities;
  }

  private async checkPyPIAPI(packageName: string, version: string): Promise<VulnerabilityReport[]> {
    try {
      const response = await axios.get<PyPIPackageInfo>(
        `${PYPI_JSON_API}/${packageName}/${version}/json`,
        { timeout: 5000 }
      );

      const vulnerabilities: VulnerabilityReport[] = [];

      // Check if PyPI response includes vulnerabilities
      const vulns = response.data.vulnerabilities || response.data.info?.vulnerabilities || [];

      for (const vuln of vulns) {
        vulnerabilities.push({
          package: packageName,
          version: version,
          severity: this.mapSeverity(vuln.id),
          description: vuln.details || 'No description available',
          cveIds: vuln.aliases?.filter(a => a.startsWith('CVE-')) || [],
          advisoryLinks: vuln.link ? [vuln.link] : [],
          fixedVersions: vuln.fixed_in,
          suggestedUpgrade: vuln.fixed_in?.[0],
          source: 'PYPI'
        });
      }
      
      return vulnerabilities;
    } catch (error) {
      // Package not found or no vulnerability data
      return [];
    }
  }

  private async checkPyPAAdvisories(packageName: string, version: string): Promise<VulnerabilityReport[]> {
    try {
      // Query GitHub API for advisories for this package
      // The advisories are organized by package name in the repo
      const advisoryPath = `${PYPI_ADVISORY_API}/${packageName}`;
      
      const response = await axios.get(advisoryPath, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 5000
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      const vulnerabilities: VulnerabilityReport[] = [];

      // Fetch each advisory file
      for (const file of response.data) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          try {
            const advisoryResponse = await axios.get<PyPAAdvisory>(file.download_url, {
              timeout: 5000
            });

            const advisory = advisoryResponse.data;

            // Check if this advisory affects the current version
            if (this.isVersionAffected(advisory, version)) {
              const vuln = this.convertAdvisoryToReport(advisory, packageName, version);
              vulnerabilities.push(vuln);
            }
          } catch (error) {
            // Skip this advisory if we can't fetch it
            continue;
          }
        }
      }

      return vulnerabilities;
    } catch (error) {
      // Package not in advisory database or API error
      return [];
    }
  }

  private isVersionAffected(advisory: PyPAAdvisory, version: string): boolean {
    if (!advisory.affected || advisory.affected.length === 0) {
      return false;
    }

    for (const affected of advisory.affected) {
      // Check if version is in the affected versions list
      if (affected.versions && affected.versions.includes(version)) {
        return true;
      }

      // Check if version falls within affected ranges
      if (affected.ranges) {
        // For simplicity, we'll consider it affected if there's any range
        // A more sophisticated implementation would parse version ranges
        return true;
      }
    }

    return false;
  }

  private convertAdvisoryToReport(
    advisory: PyPAAdvisory, 
    packageName: string, 
    version: string
  ): VulnerabilityReport {
    const cveIds = advisory.aliases?.filter(a => a.startsWith('CVE-')) || [];
    const advisoryLinks: string[] = [];

    if (advisory.references) {
      advisoryLinks.push(...advisory.references.map(r => r.url));
    }

    // Add PyPA advisory link
    advisoryLinks.push(`https://github.com/pypa/advisory-database/tree/main/vulns/${packageName}/${advisory.id}.json`);

    // Extract fixed versions
    const fixedVersions: string[] = [];
    if (advisory.affected) {
      for (const affected of advisory.affected) {
        if (affected.ranges) {
          for (const range of affected.ranges) {
            for (const event of range.events) {
              if (event.fixed) {
                fixedVersions.push(event.fixed);
              }
            }
          }
        }
      }
    }

    // Map severity
    let severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' = 'UNKNOWN';
    if (advisory.database_specific?.severity) {
      const sev = advisory.database_specific.severity.toUpperCase();
      if (sev === 'LOW' || sev === 'MODERATE' || sev === 'HIGH' || sev === 'CRITICAL') {
        severity = sev as any;
      }
    }

    return {
      package: packageName,
      version: version,
      severity: severity,
      description: advisory.summary || advisory.details || 'No description available',
      cveIds: cveIds,
      advisoryLinks: advisoryLinks,
      fixedVersions: fixedVersions.length > 0 ? fixedVersions : undefined,
      suggestedUpgrade: fixedVersions.length > 0 ? fixedVersions[0] : undefined,
      source: 'PYPI'
    };
  }

  private mapSeverity(advisoryId: string): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' {
    // Without explicit severity info, return UNKNOWN
    // Could be enhanced with additional heuristics
    return 'UNKNOWN';
  }

  async batchCheck(packages: Array<{ name: string; version: string }>): Promise<VulnerabilityReport[]> {
    const allVulnerabilities: VulnerabilityReport[] = [];
    
    // Check packages in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);
      const promises = batch.map(pkg => this.checkPackage(pkg.name, pkg.version));
      const results = await Promise.all(promises);
      allVulnerabilities.push(...results.flat());
    }

    return allVulnerabilities;
  }
}

