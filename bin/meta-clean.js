#!/usr/bin/env node

const chalk = require('chalk');
const cp = require('child_process');
const forEach = require('lodash/forEach');
const { program } = require('commander');
const { promisify } = require('util');
const metaLib = require('../lib/meta');

const exec = promisify(cp.exec);
const meta = metaLib.get();

async function clean(projectName) {
  const gitPath = `${process.cwd()}/${projectName}/`;
  const errors = [];
  const output = [];

  let branches;

  try {
    branches = await exec(`git -C ${gitPath} branch --merged | egrep -v "(^\\*|main|qa|production)"`);
    branches = branches.stdout.trim();
  } catch (err) {
    output.push('Nothing to do.');
  }

  if (branches) {
    try {
      const result = await exec(`echo "${branches}" | xargs git -C ${gitPath} branch -d`);
      if (result.stdout) {
        output.push(result.stdout.trim());
      }
      if (result.stderr) {
        errors.push(result.stderr.trim());
      }
    } catch (err) {
      errors.push(err.message);
    }
  }

  try {
    const result = await exec(`xargs git -C ${gitPath} remote prune origin`);
    if (result.stdout) {
      output.push(result.stdout.trim());
    }
    if (result.stderr) {
      errors.push(result.stderr.trim());
    }
  } catch (err) {
    errors.push(err.message);
  }

  console.log(`${chalk.blue(projectName)}:`); // eslint-disable-line no-console
  if (output.length > 0) {
    output.forEach((line) => console.log(chalk.green(line))); // eslint-disable-line no-console
    console.log(); // eslint-disable-line no-console
  }

  if (errors.length > 0) {
    errors.forEach((line) => console.error(chalk.red(line))); // eslint-disable-line no-console
  }
}

program
  .version('1.0.0')
  .action(() => {
    forEach(meta.projects, async (repo, projectName) => {
      await clean(projectName);
    });
  });

program.parse(process.argv);
