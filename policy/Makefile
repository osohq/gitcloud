# Determine which version of the local binary to fetch
#
# The local binary is provided for the following architectures
# Linux x86_64
# Apple x86_64
# Apple arm

ifneq ($(OS),Windows_NT)
	UNAME_S := $(shell uname -s)
	UNAME_P := $(shell uname -p)

	ifeq ($(UNAME_S),Linux)
		ifeq ($(UNAME_P), x86_64)
			LOCAL_BINARY_ARCHIVE=oso-local-development-binary-linux-x86_64.tar.gz
		endif
	endif
	ifeq ($(UNAME_S),Darwin)
		ifneq ($(filter arm%,$(UNAME_P)),)
			LOCAL_BINARY_ARCHIVE=oso-local-development-binary-macos-arm64.tar.gz
		endif
		ifeq ($(UNAME_P), x86_64)
			LOCAL_BINARY_ARCHIVE=oso-local-development-binary-macos-x86_64.tar.gz
    	endif
	endif
endif

# Fail with an error if the local binary doesn't exist for this system.
# This is a prerequisite of the local testing target,
# so it will fail with an explanation on unsupported systems.
validate:
ifndef LOCAL_BINARY_ARCHIVE
	$(error "The Oso Cloud local binary is not available for this OS or processor architecture")
endif

.bin:
	mkdir .bin

# Fetch the local development binary from s3,
# extract it to policy/.bin
# and make it executable
.bin/standalone: | .bin
	wget -P .bin https://oso-local-development-binary.s3.amazonaws.com/$(LOCAL_BINARY_ARCHIVE)
	tar -xvzf .bin/$(LOCAL_BINARY_ARCHIVE) -C .bin
	rm -f .bin/$(LOCAL_BINARY_ARCHIVE)
	chmod 0755 .bin/standalone

test: validate authorization.polar .bin/standalone
# Start the local binary if it's not already running
	@ps -ef | grep 'standalone' | grep -v grep >> /dev/null ||  (.bin/standalone & sleep 20)
# Run the policy tests in authorization.polar against the local binary
	@OSO_URL=http://localhost:8080 oso-cloud test authorization.polar
# Stop the local binary
	@(kill -s HUP `ps -ef | grep 'standalone' | grep -v 'grep' | awk '{$$1=$$1};1' | cut -d ' ' -f 2`)

setup: .bin/standalone
# Only copy the pre-commit hook into place if it doesn't already exist,
# in case someone has already set up a custom pre-commit hook.
ifeq (,$(wildcard ../.git/hooks/pre-commit))
	cp ../scripts/pre-commit ../.git/hooks/pre-commit
else
	$(info ".git/hooks/pre-commit already exists. Not overwriting.")
endif	


.PHONY: setup test validate stop-local-oso