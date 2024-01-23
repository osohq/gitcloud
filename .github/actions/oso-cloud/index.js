const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function installOsoCloudCLI() {
    console.log(`Installing Oso Cloud CLI`);

    let wgetOutput = '';
    let wgetError = '';
    let catOutput = '';
    let catError = '';

    const wgetOptions = {};
    const catOptions = {};

    wgetOptions.listeners = {
      stdout: (data) => {
        wgetOutput += data.toString();
      },
      stderr: (data) => {
        wgetError += data.toString();
      }
    };

    catOptions.listeners = {
      stdout: (data) => {
        catOutput += data.toString();
      },
      stderr: (data) => {
        catError += data.toString();
      }
    };

    await exec.exec('wget', ['https://cloud.osohq.com/install.sh'], wgetOptions)
    await exec.exec('cat', ['./install.sh'], catOptions)

    console.log(`wget stdout:`)
    console.log(wgetOutput)
    console.log(`wget stderr:`)
    console.log(wgetError)

    console.log(`cat stdout:`)
    console.log(catOutput)
    console.log(`cat stderr:`)
    console.log(catError)

    core.setOutput("version", '1.0');

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
}

installOsoCloudCLI();