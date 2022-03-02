#!/bin/bash
set -ex

export PGDB_DB_NAME="eg"
export PGDB_SUPER_URL="postgresql://postgres:postgres@localhost:5414/"
export PGDB_URL="postgresql://localhost:5414/"
export PGDB_DBA_PASSWORD="dba"
export PGDB_APP_PASSWORD="app"
export PGDB_RO_APP_PASSWORD="ro_app"
export PGDB_STAFF_PASSWORD="staff"
export PGDB_RO_STAFF_PASSWORD="ro_staff"

export CONFIG_ENV="dev"

pushd ../../lib/base/v1
./setup.sh
popd
