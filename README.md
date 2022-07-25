# GitCloud

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app is implemented as multiple backend services (in the
`services/` directory) that use Oso Cloud as a shared central authorization
system and a React frontend (in the `frontend/` directory).

This application is built as an example for [Oso Cloud](https://cloud-docs.osohq.com/).
If you are looking for an example of using the Oso library, check out
[osohq/gitclub](https://github.com/osohq/gitclub).

## Backend services

### GitClub (Python - SQLAlchemy - Flask)

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app uses the [`oso-cloud`][pypi-oso-cloud] Python
library to model, manage, and enforce authorization.

[pypi-oso-cloud]: https://pypi.org/project/oso-cloud/

The [Oso Cloud documentation][docs] is a good reference for more information on
Oso's [Python][docs-python] library.

[docs]: https://cloud-docs.osohq.com/
[docs-python]: https://cloud-docs.osohq.com/reference/client-apis/python

### Actions Service (Node.js - TypeORM - Express.js)

This is an example application based on GitHub Actions that's meant to model
GitHub Actions's permissions system. The app uses the
[`oso-cloud`][npm-oso-cloud] Node.js library to model, manage, and enforce
authorization.

[npm-oso-cloud]: https://www.npmjs.com/package/oso-cloud

The [Oso Cloud documentation][docs] is a good reference for more information on
Oso's [Node.js][docs-node] library.

[docs-node]: https://cloud-docs.osohq.com/reference/client-apis/node

### Running tests

NOTE: ***running the test suite against an Oso Cloud instance will reset all
data in that instance.*** This ensures each test starts from a clean slate.

To run the test suite, which, again, *will reset data and perform many
authorization requests against the target Oso Cloud instance*, grab your API
key from https://cloud.osohq.com/dashboard and export it as the `OSO_AUTH`
environment variable.

```console
$ export OSO_AUTH="0123456789"
$ make test
```

### Running the services

Run GitClub in one terminal:

```console
make -C services/gitclub
```

Run the Actions Service in another terminal:

```console
make -C services/actions
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

The GitClub service runs on port 5000; the Actions service runs on port 5001.
The frontend knows to make requests to 5001 for Actions and 5000 for everything
else. In a real production scenario, these disparate backend APIs would
probably be abstracted behind an API gateway or similar.

The GitClub service uses cookies to manage sessions. The Actions service looks
for a special `user` header that contains the logged-in user's super secret
token... which is also their ID... which is also their email. In a production
scenario, the authentication system should be a lot more secure. It doesn't
really matter for our purposes, where we really only care about showing off
authorization might.

If you want to be able to debug/test the backend without running the frontend
and logging in, you can use the following to save a session locally:

### Save the cookies

```bash
curl -c gitclub.cookies -H "Content-Type: application/json" -X POST -d '{"id": "john@beatles.com"}' localhost:5000/session
```

### Use the cookies

```bash
curl -b gitclub.cookies localhost:5000/orgs/1
```
