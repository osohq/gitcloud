const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

try {
  console.log(`Installing Oso Cloud CLI`);
  await exec.exec('curl', ['-L', 'https://cloud.osohq.com/install.sh'])
  await exec.exec('cat', ['./install.sh'])
  
  core.setOutput("version", '1.0');
  
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
