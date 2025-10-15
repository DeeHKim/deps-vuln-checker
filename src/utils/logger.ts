import chalk from 'chalk';

export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('🔍'), message);
    }
  }

  section(title: string): void {
    console.log('\n' + chalk.bold.underline(title));
  }

  vulnerability(
    severity: string, 
    name: string, 
    version: string, 
    description: string,
    cveIds: string[],
    advisoryLinks: string[],
    source: string,
    suggestedUpgrade?: string
  ): void {
    const severityColor = this.getSeverityColor(severity);
    console.log(
      severityColor(`  [${severity}]`),
      chalk.white.bold(`${name}@${version}`),
      chalk.gray(`(${source})`)
    );
    console.log('   ', chalk.gray(description));
    
    if (cveIds.length > 0) {
      console.log('   ', chalk.cyan('CVE IDs:'), cveIds.join(', '));
    }
    
    if (advisoryLinks.length > 0) {
      console.log('   ', chalk.cyan('Advisory:'), advisoryLinks[0]);
    }
    
    if (suggestedUpgrade) {
      console.log('   ', chalk.green('Fix available:'), `Upgrade to ${suggestedUpgrade}`);
    }
    console.log('');
  }

  private getSeverityColor(severity: string) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return chalk.red.bold;
      case 'high':
        return chalk.red;
      case 'moderate':
        return chalk.yellow;
      case 'low':
        return chalk.blue;
      default:
        return chalk.white;
    }
  }
}

