const core = require('@actions/core');
const exec = require('@actions/exec');

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


    cmds = [];
    cmds.push(['pwd']);
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