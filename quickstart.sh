#!/bin/sh
## Inspired by the installer for Deno.js: Copyright 2022 the Deno authors.
## All rights reserved. MIT license

# error on any sub-command failure
set -e

# the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# the temp directory used, within $DIR
# omit the -p parameter to create a temporal directory in the default location
WORK_DIR=`mktemp -d -p "$DIR"`

STANDALONE_VERSION="dev"

# check if tmp dir was created
if [[ ! "$WORK_DIR" || ! -d "$WORK_DIR" ]]; then
  echo "Could not create temp dir"
  exit 1
fi


# deletes the temp directory
function cleanup {      
  rm -rf "$WORK_DIR"
  echo "Deleted temp working directory $WORK_DIR"
}

# register the cleanup function to be called on the EXIT signal
trap cleanup EXIT



function get_os() {
    case $(uname -sm) in
    "Darwin x86_64") target="mac_x86_64" ;;
    "Darwin arm64") target="mac_arm64" ;;
    *) target="linux_musl" ;;
    esac
    echo $target
}

function download_cli() {
    echo "Downloading Oso CLI..."
    curl -L https://cloud.osohq.com/install.sh | bash
    export PATH="$HOME/.local/bin:$PATH"
    echo "Oso CLI installed successfully. Run 'oso --help' to get started"
}


function download_standalone() {
    root_url="https://oso-local-development-binary.s3.amazonaws.com/${STANDALONE_VERSION}/oso-local-development-binary"
    target=$(get_os)
    echo "Downloading Oso Local Development Binary"
    case $target in 
    "mac_x86_64") oso_url="${root_url}-macos-x86_64.tar.gz" ;;
    "mac_arm64") oso_url="${root_url}-macos-arm64.tar.gz" ;;
    "linux_musl") oso_url="${root_url}-linux-x86_64.tar.gz" ;;
    *) echo "Unsupported OS: $target"; exit 1 ;;
    esac

    echo "Downloading from: $oso_url"

    bin_name="oso-standalone"
    tarball="$WORK_DIR/oso.tar.gz"
    executable="services/oso/${bin_name}"

    # Remove any previous version of the CLI before installion.
    if  [ -f "$executable" ]; then
    echo "Upgrading installation... Removing existing Oso binaries."
    rm "${executable}"
    fi

    # download the oso CLI binary to the install directory
    curl -s --location --output "${tarball}" $oso_url

    tar xvf "${tarball}" -C "$WORK_DIR"
    mv "${WORK_DIR}/standalone" "${executable}"

    # make it executable
    chmod +x "${executable}"

    echo "Oso Cloud Local Development Binary was installed successfully. run '${bin_name}' to get started"
}

function download_standalone_docker() {
    root_url="https://oso-local-development-binary.s3.amazonaws.com/${STANDALONE_VERSION}/oso-local-development-binary"
    target=$(get_os)
    echo "Downloading Oso Local Development Binary"
    case $target in 
    "mac_x86_64") oso_url="${root_url}-linux-x86_64.tar.gz" ;;
    "mac_arm64") oso_url="${root_url}-linux-arm64.tar.gz" ;;
    "linux_musl") oso_url="${root_url}-linux-x86_64.tar.gz" ;;
    *) echo "Unsupported OS: $target"; exit 1 ;;
    esac

    echo "Downloading from: $oso_url"



    bin_name="oso-standalone-linux"
    tarball="$WORK_DIR/oso.tar.gz"
    executable="services/oso/${bin_name}"

    # Remove any previous version of the CLI before installion.
    if  [ -f "$executable" ]; then
    echo "Upgrading installation... Removing existing Oso binaries."
    rm "${executable}"
    fi

    # download the oso CLI binary to the install directory
    curl -s --location --output "${tarball}" $oso_url

    tar xvf "${tarball}" -C "$WORK_DIR"
    mv "${WORK_DIR}/standalone" "${executable}"

    # make it executable
    chmod +x "${executable}"

    echo "Oso Cloud Local Development Binary was installed successfully. run '${bin_name}' to get started"
}

# download_cli
download_standalone
# download_standalone_docker