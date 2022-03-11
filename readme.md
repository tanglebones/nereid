# nereid

Nereid is the 3rd largest moon of Neptune.

## Setup

* `npm install` at the workspace root
* `npm run build_libs` as the error you get for an un-build workspace dependency is not clear.
* NOTE: Any time you change code in a workspace dependency you need to re-built it or the code used will be out of date. 
* postgres: https://www.postgresql.org/download/
  * testing with v14
  * use `postgres` as the password for the `postgres` account
  * install at C:\pg\14
  * use port 5414 (I use `54${major_version}` as I often run more than one version)
  * add pg to your path (eg: add `export PATH=$PATH:/c/pg/14/bin` to your `.zshrc` and restart your shell.)
* install the `eg` db.
  * `npm run reset_pgdb_eg`
