\set postfix _dba
\set user :db_name:postfix
drop user if exists :user ;

\set postfix _app
\set user :db_name:postfix
drop user if exists :user ;

\set postfix _ro_app
\set user :db_name:postfix
drop user if exists :user;

\set postfix _staff
\set user :db_name:postfix
drop user if exists :user ;

\set postfix _ro_staff
\set user :db_name:postfix
drop user if exists :user ;

\set postfix
\set user