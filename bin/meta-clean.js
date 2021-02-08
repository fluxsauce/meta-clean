#!/usr/bin/env node

const cp = require('child_process');
const forEach = require('lodash/forEach');
const { program } = require('commander');
const { promisify } = require('util');
const metaLib = require('../lib/meta');

const exec = promisify(cp.exec);
const meta = metaLib.get();

program
  .version('1.0.0')
  .action(() => {
    forEach(meta.projects, async (repo, projectName) => {
      const gitPath = `${process.cwd()}/${projectName}/`;
      try {
        const branches = await exec(`git -C ${gitPath} branch --merged | egrep -v "(^\\*|main|qa|production)"`);
        if (branches.stderr) {
          console.err(branches.stderr.trim()); // eslint-disable-line no-console
        }
        if (branches.stdout.trim()) {
          const result = await exec(`echo "${branches.stdout.trim()}" | xargs git -C ${gitPath} branch -d`);
          if (result.stdout) {
            console.log(result.stdout.trim()); // eslint-disable-line no-console
          }
          if (result.stderr) {
            console.err(result.stderr.trim()); // eslint-disable-line no-console
          }
        }
      } catch (err) { // eslint-disable-line no-unused-vars
        console.error(err.message); // eslint-disable-line no-console
      }
    });
  });

program.parse(process.argv);
