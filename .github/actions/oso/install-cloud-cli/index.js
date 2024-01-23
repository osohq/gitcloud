const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function installOsoCloudCLI() {
    console.log(`Installing Oso Cloud CLI`);

    let installOutput = '';
    let installError = '';
    let versionOutput = '';
    let versionError = '';

    const installOptions = {};
    const versionOptions = {};

    versionOptions.listeners = {
      stdout: (data) => {
        versionOutput += data.toString();
      },
      stderr: (data) => {
        versionError += data.toString();
      }
    };

    installOptions.listeners = {
      stdout: (data) => {
        installOutput += data.toString();
      },
      stderr: (data) => {
        installError += data.toString();
      }
    };

    await exec.exec('/bin/bash', ['-c', 'curl -L https://cloud.osohq.com/install.sh | /bin/bash'], installOptions)
    console.log(`install stdout:`)
    console.log(installOutput)
    console.log(`install stderr:`)
    console.log(installError)

    await exec.exec('oso-cloud', ['version'], versionOptions)
    console.log(`version stdout:`)
    console.log(versionOutput)
    console.log(`version stderr:`)
    console.log(versionError)

    core.setOutput("version", versionOutput);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
}

installOsoCloudCLI();