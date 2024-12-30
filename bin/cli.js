#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const { convertToPdf } = require('../src/index');
const chalk = require('chalk');
const i18n = require('../src/utils/i18n');
const { updateProgress } = require('../src/utils/progress');

program
  .version(version)
  .option('--lang <language>', 'Interface language (en/tr)', 'en')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    i18n.setLocale(opts.lang);
  });

program
  .description(i18n.t('cli.description'))
  .argument('<source>', i18n.t('cli.arguments.source'))
  .argument('<output>', i18n.t('cli.arguments.output'))
  .option('-t, --theme <theme>', i18n.t('cli.options.theme'), 'light')
  .option('-l, --lang-filter <extensions>', i18n.t('cli.options.langFilter'))
  .option('-n, --line-numbers', i18n.t('cli.options.lineNumbers'), false)
  .option('-g, --git-history', i18n.t('cli.options.gitHistory'), false)
  .option('-m, --metadata', i18n.t('cli.options.metadata'), true)
  .option('-c, --commit-info', i18n.t('cli.options.commitInfo'), false)
  .option('-e, --exclude <pattern>', i18n.t('cli.options.exclude'))
  .option('-s, --max-size <size>', i18n.t('cli.options.maxSize'), '1000')
  .option('-p, --progress', i18n.t('cli.options.progress'), false)
  .action(async (source, output, options) => {
    try {
      console.log(chalk.blue(i18n.t('cli.messages.starting')));
      
      // Process options
      const maxSize = parseInt(options.maxSize, 10) * 1024;
      const excludePatterns = options.exclude ? options.exclude.split(',').map(p => p.trim()) : [];
      
      await convertToPdf(source, output, {
        ...options,
        maxSize,
        excludePatterns
      });
      
      console.log(chalk.green(i18n.t('cli.messages.success', { output })));
    } catch (error) {
      console.error(chalk.red(i18n.t('cli.messages.error', { message: error.message })));
      process.exit(1);
    }
  });

program.parse(); 