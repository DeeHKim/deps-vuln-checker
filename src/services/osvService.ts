import axios from 'axios';
import { OSVResponse, OSVVulnerability, VulnerabilityReport } from '../types';

const OSV_API_URL = 'https://api.osv.dev/v1/query';

export class OSVService {
  async queryPackage(packageName: string, version: string, ecosystem: string): Promise<VulnerabilityReport[]> {
    // Skip if version is missing or invalid
    if (!version || version.trim() === '') {
      return [];
    }

    try {
      const response = await axios.post<OSVResponse>(OSV_API_URL, {
        package: {
          name: packageName,
          ecosystem: ecosystem
        },
        version: version
      });

      if (!response.data.vulns || response.data.vulns.length === 0) {
        return [];
      }
      
      return response.data.vulns.map(vuln => this.convertOSVToReport(vuln, packageName, version));
    } catch (error) {
      // If package not found or other error, return empty array
      return [];
    }
  }

  async batchQuery(packages: Array<{ name: string; version: string; ecosystem: string }>): Promise<VulnerabilityReport[]> {
    const allVulnerabilities: VulnerabilityReport[] = [];
    
    // OSV API has rate limits, so we'll batch requests
    const batchSize = 10;
    for (let i = 0; i < packages.length; i += batchSize) {
      const batch = packages.slice(i, i + batchSize);
      const promises = batch.map(pkg => this.queryPackage(pkg.name, pkg.version, pkg.ecosystem));
      const results = await Promise.all(promises);
      allVulnerabilities.push(...results.flat());
    }

    return allVulnerabilities;
  }

  private convertOSVToReport(vuln: OSVVulnerability, packageName: string, version: string): VulnerabilityReport {
    // Extract CVE IDs from aliases
    const cveIds = (vuln.aliases || []).filter(alias => alias.startsWith('CVE-'));
    
    // Extract advisory links (only those marked as ADVISORY type)
    // Prioritize GitHub advisory links first
    const advisoryLinks = (vuln.references || [])
      .filter(ref => ref.type === 'ADVISORY')
      .map(ref => ref.url)
      .sort((a, b) => {
        const aIsGitHub = a.includes('github.com/advisories');
        const bIsGitHub = b.includes('github.com/advisories');
        if (aIsGitHub && !bIsGitHub) return -1;
        if (!aIsGitHub && bIsGitHub) return 1;
        return 0;
      });

    // Extract fixed versions
    const fixedVersions: string[] = [];
    if (vuln.affected) {
      for (const affected of vuln.affected) {
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

    // Determine severity
    let severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' = 'UNKNOWN';
    if (vuln.severity && vuln.severity.length > 0) {
      const cvss = vuln.severity.find(s => s.type === 'CVSS_V3');
      if (cvss) {
        const score = parseFloat(cvss.score.split(':')[1] || '0');
        if (score >= 9.0) severity = 'CRITICAL';
        else if (score >= 7.0) severity = 'HIGH';
        else if (score >= 4.0) severity = 'MODERATE';
        else severity = 'LOW';
      }
    }

    return {
      package: packageName,
      version: version,
      severity: severity,
      description: vuln.summary || vuln.details || 'No description available',
      cveIds: cveIds,
      advisoryLinks: advisoryLinks,
      fixedVersions: fixedVersions.length > 0 ? fixedVersions : undefined,
      suggestedUpgrade: fixedVersions.length > 0 ? fixedVersions[0] : undefined,
      source: 'OSV'
    };
  }
}

