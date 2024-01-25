const core = require('@actions/core');
const exec = require('@actions/exec');
const path = require('path');
const fs = require('fs');
const { globSync } = require('glob');

async function validatePolicySyntax() {
    console.log(`Installing Oso Cloud local binary`);


    let stdout = '';
    let stderr = '';

    const options = {};

    options.listeners = {
      stdout: (data) => {
        stdout += data.toString();
      },
      stderr: (data) => {
        stderr += data.toString();
      }
    };

    const polarFiles = globSync('**/*.polar', { ignore: 'node_modules/**' }).filter((file) => !fs.lstatSync(file).isSymbolicLink());
    
    console.log(polarFiles)
    
    cmds = [];
    cmds.push(['oso-cloud', ['validate', polarFiles.join(" ")]]);
    cmds.push(['ls']);

    for(const item of cmds) {
      stdout = '';
      stderr = '';
      const cmd = item[0];
      const args = item[1];

      console.log(`cmd: ${cmd}, args: ${args}`);
      await exec.exec(cmd, args, options);

      console.log(`stdout:`)
      console.log(stdout)
      console.log(`stderr:`)
      console.log(stderr)

    }
}

validatePolicySyntax();