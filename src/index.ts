#!/usr/bin/env node

import { createCLI, parseCLIOptions, detectFileType, prioritizeFiles } from './cli';
import { parseFile } from './parsers';
import { VulnerabilityChecker } from './checkers';
import { Logger } from './utils/logger';
import { FileType, ParseResult, CLIOptions } from './types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const program = createCLI();
  program.parse(process.argv);

  let options: CLIOptions = parseCLIOptions(program);
  const logger = new Logger(options.verbose);

  // Process positional file arguments
  if (options.files && options.files.length > 0) {
    for (const filePath of options.files) {
      const fileType = detectFileType(filePath);
      if (!fileType) {
        logger.warning(`Unknown file type: ${filePath}, skipping...`);
        continue;
      }

      // Add to options based on file type
      switch (fileType) {
        case FileType.PACKAGE_JSON:
          options.packageJson = filePath;
          break;
        case FileType.PACKAGE_LOCK:
          options.packageLock = filePath;
          break;
        case FileType.YARN_LOCK:
          options.yarnLock = filePath;
          break;
        case FileType.REQUIREMENTS_TXT:
          options.requirementsTxt = filePath;
          break;
        case FileType.PIPFILE_LOCK:
          options.pipfileLock = filePath;
          break;
        case FileType.POETRY_LOCK:
          options.poetryLock = filePath;
          break;
      }
    }
  }

  // Apply priority logic for lock files
  options = prioritizeFiles(options);

  // Check if at least one file option is provided
  const hasFileOption = options.packageJson || 
                        options.packageLock || 
                        options.yarnLock || 
                        options.requirementsTxt || 
                        options.pipfileLock ||
                        options.poetryLock;

  if (!hasFileOption) {
    logger.error('Please provide at least one file to check');
    logger.info('Usage: security-checker [files...] [options]');
    logger.info('Example: security-checker package.json');
    logger.info('         security-checker package-lock.json requirements.txt');
    logger.info('Use --help for more information');
    process.exit(1);
  }

  const parseResults: ParseResult[] = [];
  const filesToParse: Array<{ path: string; type: FileType }> = [];

  // Collect files to parse
  if (options.packageJson) filesToParse.push({ path: options.packageJson, type: FileType.PACKAGE_JSON });
  if (options.packageLock) filesToParse.push({ path: options.packageLock, type: FileType.PACKAGE_LOCK });
  if (options.yarnLock) filesToParse.push({ path: options.yarnLock, type: FileType.YARN_LOCK });
  if (options.requirementsTxt) filesToParse.push({ path: options.requirementsTxt, type: FileType.REQUIREMENTS_TXT });
  if (options.pipfileLock) filesToParse.push({ path: options.pipfileLock, type: FileType.PIPFILE_LOCK });
  if (options.poetryLock) filesToParse.push({ path: options.poetryLock, type: FileType.POETRY_LOCK });

  try {
    // Parse provided files
    if (!options.json) {
      logger.section('📋 Parsing dependency files...');
    }

    for (const file of filesToParse) {
      logger.debug(`Parsing ${file.path}`);
      
      // Check if file exists
      if (!fs.existsSync(file.path)) {
        logger.error(`File not found: ${file.path}`);
        process.exit(1);
      }

      const result = await parseFile(file.path, file.type);
      parseResults.push(result);
      
      if (!options.json) {
        logger.success(`Parsed ${result.dependencies.length} dependencies from ${path.basename(file.path)}`);
      }
    }

    // Load ignore list if provided
    let ignoreList: { cveIds?: string[]; severityIgnore?: string[] } | undefined;
    if (options.ignore) {
      try {
        if (!fs.existsSync(options.ignore)) {
          logger.error(`Ignore list file not found: ${options.ignore}`);
          process.exit(1);
        }
        const ignoreFileContent = fs.readFileSync(options.ignore, 'utf-8');
        ignoreList = JSON.parse(ignoreFileContent);
        
        if (!options.json) {
          logger.debug(`Loaded ignore list from ${options.ignore}`);
          if (ignoreList?.cveIds && ignoreList.cveIds.length > 0) {
            logger.debug(`  Ignoring ${ignoreList.cveIds.length} CVE ID(s)`);
          }
          if (ignoreList?.severityIgnore && ignoreList.severityIgnore.length > 0) {
            logger.debug(`  Ignoring severity level(s): ${ignoreList.severityIgnore.join(', ')}`);
          }
        }
      } catch (error) {
        logger.error(`Failed to parse ignore list: ${(error as Error).message}`);
        process.exit(1);
      }
    }

    // Check for vulnerabilities
    if (!options.json) {
      logger.section('🔍 Checking for vulnerabilities...');
    }

    const checker = new VulnerabilityChecker(logger);
    const checkerResult = await checker.checkDependencies(parseResults, ignoreList);

    // Output results
    if (options.json) {
      // JSON output
      const jsonOutput = {
        summary: {
          totalDependencies: checkerResult.totalDependencies,
          vulnerablePackages: checkerResult.vulnerablePackages,
          percentageVulnerable: checkerResult.percentageVulnerable,
          vulnerabilitiesFound: checkerResult.vulnerabilitiesFound,
          bySeverity: checkerResult.summary
        },
        vulnerabilities: checkerResult.vulnerabilities.map(v => ({
          package: v.package,
          version: v.version,
          severity: v.severity,
          description: v.description,
          cveIds: v.cveIds,
          advisoryLinks: v.advisoryLinks,
          fixedVersions: v.fixedVersions,
          suggestedUpgrade: v.suggestedUpgrade,
          source: v.source
        })),
        scannedFiles: parseResults.map(r => ({
          file: path.basename(r.filePath),
          type: r.fileType,
          dependencyCount: r.dependencies.length
        }))
      };
      
      const jsonString = JSON.stringify(jsonOutput, null, 2);
      
      // If json is a string, it's a file path - write to file
      if (typeof options.json === 'string') {
        const outputPath = path.resolve(options.json);
        fs.writeFileSync(outputPath, jsonString, 'utf-8');
        console.log(`✅ JSON report written to: ${outputPath}`);
      } else {
        // Otherwise output to console
        console.log(jsonString);
      }
    } else {
      // Human-readable output
      logger.section('📊 Results Summary');
      console.log(`  Total dependencies scanned: ${checkerResult.totalDependencies}`);
      console.log(`  Vulnerable packages: ${checkerResult.vulnerablePackages} (${checkerResult.percentageVulnerable.toFixed(1)}%)`);
      console.log(`  Total vulnerabilities: ${checkerResult.vulnerabilitiesFound}`);
      console.log('');
      console.log('  Severity breakdown:');
      console.log(`    🔴 Critical: ${checkerResult.summary.critical}`);
      console.log(`    🟠 High: ${checkerResult.summary.high}`);
      console.log(`    🟡 Moderate: ${checkerResult.summary.moderate}`);
      console.log(`    🟢 Low: ${checkerResult.summary.low}`);
      if (checkerResult.summary.unknown > 0) {
        console.log(`    ⚪ Unknown: ${checkerResult.summary.unknown}`);
      }

      if (checkerResult.vulnerabilitiesFound === 0) {
        logger.section('✅ No vulnerabilities found!');
      } else {
        logger.section('🚨 Vulnerabilities Details');
        
        for (const vuln of checkerResult.vulnerabilities) {
          logger.vulnerability(
            vuln.severity,
            vuln.package,
            vuln.version,
            vuln.description,
            vuln.cveIds,
            vuln.advisoryLinks,
            vuln.source,
            vuln.suggestedUpgrade
          );
        }

        logger.section('💡 Remediation Summary');
        const fixableCount = checkerResult.vulnerabilities.filter(v => v.suggestedUpgrade).length;
        console.log(`  ${fixableCount} out of ${checkerResult.vulnerabilitiesFound} vulnerabilities have fixes available.`);
        
        if (fixableCount > 0) {
          console.log('');
          logger.info('Run the following commands to update vulnerable packages:');
          
          // Group by package manager
          const npmVulns = checkerResult.vulnerabilities.filter(v => 
            parseResults.some(r => 
              (r.fileType === FileType.PACKAGE_JSON || 
               r.fileType === FileType.PACKAGE_LOCK || 
               r.fileType === FileType.YARN_LOCK) &&
              r.dependencies.some(d => d.name === v.package)
            ) && v.suggestedUpgrade
          );

          if (npmVulns.length > 0) {
            console.log('');
            logger.info('For npm/yarn packages:');
            const uniqueNpmUpgrades = new Map<string, string>();
            npmVulns.forEach(v => {
              if (v.suggestedUpgrade) {
                uniqueNpmUpgrades.set(v.package, v.suggestedUpgrade);
              }
            });
            uniqueNpmUpgrades.forEach((version, pkg) => {
              console.log(`  npm install ${pkg}@${version}`);
            });
          }
        }
      }
    }

    // Exit with appropriate code
    process.exit(checkerResult.vulnerabilitiesFound > 0 ? 1 : 0);

  } catch (error) {
    logger.error(`Error: ${(error as Error).message}`);
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
