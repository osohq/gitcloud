const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

async function installOsoCloudLocalBinary() {
    console.log(`Installing Oso Cloud local binary`);


    let stdout = '';
    let stderr = '';

    cmds = [];
    cmds.push(['curl', ['-L', 'https://oso-local-development-binary.s3.amazonaws.com/latest/oso-local-development-binary-linux-x86_64.tar.gz']]);
    cmds.push(['tar', ['-xvzf', './oso-local-development-binary-linux-x86_64.tar.gz']]);
    cmds.push(['chmod', ['0700', './standalone']] );

    for(const item of cmds) {
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

      const cmd = item[0];
      const args = item[1];

      console.log(`cmd: ${cmd}, args: ${args}`);
      await exec.exec(cmd, args, options);

//      console.log(`stdout:`)
//      console.log(stdout)
//      console.log(`stderr:`)
//      console.log(stderr)
    }



    core.setOutput("version", "1.0");
}

installOsoCloudLocalBinary();