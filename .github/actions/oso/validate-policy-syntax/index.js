const exec = require('@actions/exec');
const fs = require('fs');
const { glob, globSync } = require('glob');

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

  //const polarFiles = globSync('**/*.polar', { ignore: 'node_modules/**' }).filter((file) => !fs.lstatSync(file).isSymbolicLink());
  const polarFiles = await glob('**/*.polar', { ignore: 'node_modules/**' })
  const polarFilesNoSymlinks = polarFiles.filter((file) => !fs.lstatSync(file).isSymbolicLink());
  await exec.exec('oso-cloud', ['validate'].concat(polarFilesNoSymlinks), options);
}

validatePolicySyntax();