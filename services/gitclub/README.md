# GitClub (Python - SQLAlchemy - Flask)

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app uses the [`oso-cloud`][pypi-oso-cloud] library to
model, manage, and enforce authorization.

[pypi-oso-cloud]: https://pypi.org/project/oso-cloud/

The [Oso Cloud documentation][docs] is a good reference for more information on
Oso's [Python][docs-python] library.

[docs]: https://cloud-docs.osohq.com/
[docs-python]: https://cloud-docs.osohq.com/reference/client-apis/python

## Backend

### Running tests

From the repository

```console
$ make -C tests test-flask-sqlalchemy-oso
```

### Running the backend

First set up a virtualenv and install dependencies:

```console
$ cd backends/library/flask-sqlalchemy-oso
$ make run
```

If this is the first time you've run the app, pass `True` as the second
argument to `create_app()`, which seeds the database from the `app/fixtures.py`
file:

```console
$ FLASK_APP="app:create_app(None, True)" make run
```

If you've already seeded the database, change `True` to `False` to avoid
resetting the database:

```console
$ FLASK_APP="app:create_app(None, False)" make run
```

### Architecture

- Python / SQLAlchemy / Flask
- SQLite for persistence

### Data model

The app has the following models:

- `Org` - the top-level grouping of users and resources in the app. As with
  GitHub, users can be in multiple orgs and may have different permission
  levels in each.
- `User` - identified by email address, users can have roles within orgs and
  repos.
- `Repo` - mimicking repos on GitHub — but without the backing Git data — each
  belongs to a single org.
- `Issue` - mimicking GitHub issues, each is associated with a single repo.

### Authorization model

Users can have roles on orgs and/or repos. Roles are defined in
`app/authorization.polar`.

## Frontend

### Running the frontend

```console
$ cd frontend
$ yarn
$ yarn start
```

### Architecture

- TypeScript / React / Reach Router
