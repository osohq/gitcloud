# GitCloud

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app is implemented as multiple backend services (in the
`services/` directory) that use Oso Cloud as a shared central authorization
system and a React frontend (in the `frontend/` directory).

This application is built as an example for [Oso Cloud](https://osohq.com/docs/).
If you are looking for an example of using the Oso library, check out
[osohq/gitclub](https://github.com/osohq/gitclub).

## Backend services

### Accounts / Issues (Python - SQLAlchemy - Flask)

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app uses the [`oso-cloud`][pypi-oso-cloud] Python
library to model, manage, and enforce authorization.

[pypi-oso-cloud]: https://pypi.org/project/oso-cloud/

The [Oso Cloud documentation][docs] is a good reference for more information on
Oso's [Python][docs-python] library.

[docs]: https://osohq.com/docs/
[docs-python]: https://osohq.com/docs/reference/client-apis/python

### Jobs Service (Node.js - TypeORM - Express.js)

This is an example application based on GitHub Actions that's meant to model
GitHub Actions's permissions system. The app uses the
[`oso-cloud`][npm-oso-cloud] Node.js library to model, manage, and enforce
authorization.

[npm-oso-cloud]: https://www.npmjs.com/package/oso-cloud

The [Oso Cloud documentation][docs] is a good reference for more information on
Oso's [Node.js][docs-node] library.

[docs-node]: https://osohq.com/docs/reference/client-apis/node

### Configuring your local environment

Install the `oso-cloud` CLI by following the instructions in the
[Oso Cloud Quickstart](https://www.osohq.com/docs/tutorials/quickstart#adding-oso-cloud-to-your-application)

You can optionally set up your environment for local testing by running `make setup`
from the root directory of the repository. This will do the following:

- Install the appropriate version of the Oso Cloud [local development binary](https://www.osohq.com/docs/guides/develop/local-development) for your system.
- Copy the pre-commit hook from the `scripts` directory to `.git/pre-commit` if one doesn't already exist there.
  - This will automatically validate the syntax of `policy/authorization.polar` before committing it.

### Running local policy tests

If you configured your environment for local testing above,
then you can run the policy tests locally by running the following command
from the root directory of the repository:

```
OSO_AUTH=e_0123456789_12345_osotesttoken01xiIn make test-policy
```

The `OSO_AUTH` variable is set to the local development API key as documented in the
[Setup section](https://www.osohq.com/docs/guides/develop/local-development#setup) of the Local Development Guide.
It will only work against the local development binary.

This will:

- start the local development binary
- Run the policy tests in `policy/authorization.polar` against the local development binary

### Running tests

NOTE: **_running the test suite against an Oso Cloud instance will reset all
data in that instance._** This ensures each test starts from a clean slate.

To run the test suite, which, again, _will reset data and perform many
authorization requests against the target Oso Cloud instance_, grab your API
key from https://ui.osohq.com/dashboard and export it as the `OSO_AUTH`
environment variable.

```console
$ export OSO_AUTH="0123456789"
$ make test
```

### Running the services

The first time you run these services, you'll need to upload your policy:

```console
make update-policy
```

You only need to do this once. (If you make changes to the policy, you'll need to run it again.)

Run GitClub in one terminal:

```console
make -C services/gitclub
```

Run the Jobs Service in another terminal:

```console
make -C services/jobs
```

## Frontend

### Running the frontend

```console
$ cd frontend
$ yarn
$ yarn start
```

### Architecture

- TypeScript / React / Reach Router

## Development

The GitClub service runs on port 5000; the Jobs service runs on port 5001.
The frontend knows to make requests to 5001 for Jobs and 5000 for everything
else. In a real production scenario, these disparate backend APIs would
probably be abstracted behind an API gateway or similar.

The GitClub service uses cookies to manage sessions. The Jobs service looks
for a special `x-user-id` header that contains the logged-in user's super secret
token... which is also their ID... which is also their email. In a production
scenario, the authentication system should be a lot more secure. It doesn't
really matter for our purposes, where we really only care about showing off
authorization might.

If you want to be able to debug/test the backend without running the frontend
and logging in, you can use the following to save a session locally:

### Save the cookies

```bash
curl -c gitclub.cookies -H "Content-Type: application/json" -X POST -d '{"username": "john@beatles.com"}' localhost:5000/session
```

### Use the cookies

```bash
curl -b gitclub.cookies localhost:5000/orgs/1
```

## FAQ

### I'm getting "Failed to fetch" CORS errors on Mac

Try [disabling Airplay](https://developer.apple.com/forums/thread/693768), Airplay can intercept requests to `localhost:5000`.
In the Chrome console, check the "server" response header on a failed request: if the "server" response header includes "Airplay", then Airplay is the culprit.
