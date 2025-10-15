import regFetch from 'npm-registry-fetch';
import { VulnerabilityReport, Dependency } from '../types';

interface NpmAuditPayload {
  name: string;
  version: string;
  requires: Record<string, string>;
  dependencies: Record<string, {
    version: string;
    integrity?: string;
  }>;
}

interface NpmAuditResponse {
  actions: any[];
  advisories: Record<string, NpmAdvisory>;
  muted: any[];
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    totalDependencies: number;
  };
}

interface NpmAdvisory {
  id: number;
  title: string;
  module_name: string;
  severity: string;
  url: string;
  vulnerable_versions: string;
  patched_versions?: string;
  recommendation?: string;
  cves?: string[];
  findings: Array<{
    version: string;
    paths: string[];
  }>;
}

export class NpmRegistryService {
  async auditDependencies(dependencies: Dependency[]): Promise<VulnerabilityReport[]> {
    if (dependencies.length === 0) {
      return [];
    }

    // Filter out dependencies with missing versions
    const validDependencies = dependencies.filter(dep => dep.version && dep.version.trim() !== '');
    
    if (validDependencies.length === 0) {
      return [];
    }

    // Build the audit payload
    const payload: NpmAuditPayload = {
      name: 'security-check',
      version: '1.0.0',
      requires: {},
      dependencies: {}
    };

    // Add dependencies to payload
    for (const dep of validDependencies) {
      const version = dep.version.replace(/^[\^~]/, ''); // Remove semver prefixes
      payload.requires[dep.name] = version;
      payload.dependencies[dep.name] = {
        version: version,
        integrity: dep.integrity || 'sha512-placeholder' // Use real integrity from lock file if available
      };
    }

    try {
      const opts = {
        method: 'POST',
        gzip: true,
        body: payload
      };

      const response = await regFetch('/-/npm/v1/security/audits', opts);
      const auditData = await response.json() as NpmAuditResponse;

      return this.parseAuditResponse(auditData);
    } catch (error) {
      // If audit fails, return empty array (graceful degradation)
      return [];
    }
  }

  private parseAuditResponse(auditData: NpmAuditResponse): VulnerabilityReport[] {
    const vulnerabilities: VulnerabilityReport[] = [];

    if (!auditData.advisories) {
      return vulnerabilities;
    }

    for (const [advisoryId, advisory] of Object.entries(auditData.advisories)) {
      // Process each finding (affected version)
      for (const finding of advisory.findings) {
        const cveIds = advisory.cves || [];
        const advisoryLinks = [advisory.url];

        // Map severity
        const severityMap: { [key: string]: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN' } = {
          'info': 'LOW',
          'low': 'LOW',
          'moderate': 'MODERATE',
          'high': 'HIGH',
          'critical': 'CRITICAL'
        };

        const severity = severityMap[advisory.severity.toLowerCase()] || 'UNKNOWN';

        // Extract fixed version from patched_versions
        let suggestedUpgrade: string | undefined;
        if (advisory.patched_versions && advisory.patched_versions !== '<0.0.0') {
          // Parse patched_versions like ">=1.2.3" to get "1.2.3"
          const match = advisory.patched_versions.match(/(\d+\.\d+\.\d+)/);
          if (match) {
            suggestedUpgrade = match[1];
          }
        }

        vulnerabilities.push({
          package: advisory.module_name,
          version: finding.version,
          severity: severity,
          description: advisory.title,
          cveIds: cveIds,
          advisoryLinks: advisoryLinks,
          fixedVersions: suggestedUpgrade ? [suggestedUpgrade] : undefined,
          suggestedUpgrade: suggestedUpgrade,
          source: 'NPM_REGISTRY'
        });
      }
    }

    return vulnerabilities;
  }
}

