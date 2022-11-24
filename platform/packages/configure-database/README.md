# Codefi database configuration script

To save infrastructure cost, we are exploring the idea of running multiple DBs on a single postgres container. In such a situation, microservices are responsible for creating their own databases. This package enables that.

## Scope

Currently, only postgres is supported

## What it does

It does the following
* Checks if the database exists, and if not, creates it
* Checks if the user exists, and if not, creates it
* Grants access on the database to the user

The actions performed by the script are idempotent

## How to use

### Installing the script to your repo

`npm i @consensys/configure-database`

This will add a script to `node_modules/.bin` called `configure-database` (see the package.json of this repo).

You then need to add an npm script to your repository, `database:configure` which will just call `configure-database`.

### Integration and configuration

This script will be run from a separate job and not from the microservice itself, because it is exposed to the superuser credentials of the DBMS.

You need to supply the following environment variables:

* `DB_ADMIN_USER` the admin user, used to create the database
* `DB_ADMIN_PASSWORD`
* `DB_USERNAME` the application user that will be created, granted access and subsequently used to access the DB. It should the same as `TYPEORM_USERNAME` in your actual application
* `DB_PASSWORD`
* `DB_DATABASE_NAME` the database to be created
* `DB_HOST`
* `DB_PORT` is not required, but allowed
* `DB_EXTENSIONS` is not required, but allowed. Coma separated list of extensions to install in the DB (e.g. "uuid-ossp,citext" or "uuid-ossp" )

