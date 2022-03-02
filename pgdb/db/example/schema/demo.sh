#!/bin/bash
echo "demo ${PGDB_URL}${PG_DB_NAME} [DEV]"
psql -e -d "${PGDB_URL}${PG_DB_NAME}" --echo-all -f ./schema/demo_data.sql
