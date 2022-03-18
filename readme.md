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
* install https://mayakron.altervista.org/support/acrylic/Home.htm
  * Open Acrylic Hosts, change the 127.0.0.1 line at the bottom, add ` >xxx`:
  * `127.0.0.1 localhost localhost.localdomain >xxx`
* Set your network adapter properties to use 127.0.0.1 as your DNS.
  * Network & Sharing Center
  * Change Adapter Settings
  * Pick your Adapter (probably Wi-Fi), right click - properties
  * Pick Internet Protocol Version 4 (TCP/IPv4) - properties
  * enable "Use the following DNS server address" - set to 127.0.0.1 - press Okay
  * uncheck Internet Protocol Version 6 (TCP/IPv6)
  * click ok
  * in a shell do `ping whatever.xxx` - it should now resolve to 127.0.0.1
