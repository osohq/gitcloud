const exec = require('@actions/exec');
const fs = require('fs');
const { globSync } = require('glob');

async function validatePolicySyntax() {
  console.log('Validating .polar file syntax');

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
  await exec.exec('oso-cloud', ['validate', polarFiles.join(" ")], options);
}

validatePolicySyntax();