#!/bin/bash
set -ex

function setup_db() {
  echo "dropping db  ${PGDB_DB_NAME}"
  echo "drop database ${PGDB_DB_NAME} WITH (FORCE);" | psql -X -e -d ${PGDB_SUPER_URL} -f -
  echo "dropping test db"
  echo "drop database ${PGDB_DB_NAME}_test WITH (FORCE);" | psql -X -e -d ${PGDB_SUPER_URL} -f -

  psql $PGDB_OPTS -d "${PGDB_SUPER_URL}" -f ./drop.sql

  echo "creating db ${PGDB_DB_URL}${PGDB_DB_NAME}"
  echo "create database ${PGDB_DB_NAME};" | psql -X -E -e -d ${PGDB_SUPER_URL} -f -
  psql $PGDB_OPTS -d "${PGDB_SUPER_URL}${PGDB_DB_NAME}" -f ./create.sql
  PGPASSWORD="${PGDB_DBA_PASSWORD}" psql -U "${PGDB_DB_NAME}_dba" $PGDB_OPTS -d "${PGDB_URL}${PGDB_DB_NAME}"  -f ./base.sql
}

export PGDB_OPTS="
-v db_name=$PGDB_DB_NAME
-v dba_pw=$PGDB_DBA_PASSWORD
-v app_pw=$PGDB_APP_PASSWORD
-v ro_app_pw=$PGDB_RO_APP_PASSWORD
-v staff_pw=$PGDB_STAFF_PASSWORD
-v ro_staff_pw=$PGDB_RO_STAFF_PASSWORD
-X -E -e --echo-all
"

setup_db

if [ "$CONFIG_ENV" = "dev" ]; then
  PGDB_DB_NAME=${PGDB_DB_NAME}_test
  export PGDB_OPTS="
  -v db_name=$PGDB_DB_NAME
  -v dba_pw=$PGDB_DBA_PASSWORD
  -v app_pw=$PGDB_APP_PASSWORD
  -v ro_app_pw=$PGDB_RO_APP_PASSWORD
  -v staff_pw=$PGDB_STAFF_PASSWORD
  -v ro_staff_pw=$PGDB_RO_STAFF_PASSWORD
  -X -E -e --echo-all
  "

  setup_db
fi
