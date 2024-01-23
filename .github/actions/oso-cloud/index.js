const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

console.log(`Installing Oso Cloud CLI`);

let curlOutput = '';
let curlError = '';
let catOutput = '';
let catError = '';

const curlOptions = {};
const catOptions = {};

curlOptions.listeners = {
  stdout: (data) => {
    curlOutput += data.toString();
  },
  stderr: (data) => {
    curlError += data.toString();
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

await exec.exec('curl', ['-L', 'https://cloud.osohq.com/install.sh'], curlOptions)
await exec.exec('cat', ['./install.sh'], catOptions)

console.log(`curl stdout:`)
console.log(curlOutput)
console.log(`curl stderr:`)
console.log(curlError)

console.log(`cat stdout:`)
console.log(catOutput)
console.log(`cat stderr:`)
console.log(catError)

core.setOutput("version", '1.0');

// Get the JSON webhook payload for the event that triggered the workflow
const payload = JSON.stringify(github.context.payload, undefined, 2)
console.log(`The event payload: ${payload}`);
