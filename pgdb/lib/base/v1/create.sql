\set postfix _dba
\set user_dba :db_name:postfix

\set postfix _app
\set user_app :db_name:postfix

\set postfix _ro_app
\set user_ro_app :db_name:postfix

\set postfix _staff
\set user_staff :db_name:postfix

\set postfix _ro_staff
\set user_ro_staff :db_name:postfix

create user :user_dba superuser password :'dba_pw' ;
create user :user_app password :'app_pw';
create user :user_ro_app password :'ro_app_pw';
create user :user_staff password :'staff_pw';
create user :user_ro_staff password :'ro_staff_pw';

grant connect on database :db_name to :user_dba;
grant connect on database :db_name to :user_app;
grant connect on database :db_name to :user_ro_app;
grant connect on database :db_name to :user_staff;
grant connect on database :db_name to :user_ro_staff;

drop schema public;
create schema if not exists func;

set SEARCH_PATH = func;
create extension if not exists pgcrypto;
create extension if not exists btree_gin;
create extension if not exists btree_gist;
create extension if not exists hstore;

create schema if not exists meta;
create schema if not exists app;
create schema if not exists staff;

grant all on schema meta to :user_dba;
grant all on schema func to :user_dba;
grant all on schema app to :user_dba;
grant all on schema staff to :user_dba;

grant usage on schema meta,func,app,staff to :user_staff;
grant usage on schema meta,func,app,staff to :user_ro_staff;
grant usage on schema meta,func,app to :user_app;
grant usage on schema meta,func,app to :user_ro_app;

alter default privileges for user :user_dba in schema meta grant all on tables to :user_dba;
alter default privileges for user :user_dba in schema meta grant all on functions to :user_dba;
alter default privileges for user :user_dba in schema meta grant all on routines to :user_dba;
alter default privileges for user :user_dba in schema func grant all on functions to :user_dba;
alter default privileges for user :user_dba in schema func grant all on routines to :user_dba;
alter default privileges for user :user_dba in schema func grant execute on functions to :user_app;
alter default privileges for user :user_dba in schema func grant execute on functions to :user_ro_app;
alter default privileges for user :user_dba in schema func grant execute on routines to :user_app;
alter default privileges for user :user_dba in schema func grant execute on routines to :user_ro_app;
alter default privileges for user :user_dba in schema func grant execute on functions to :user_staff;
alter default privileges for user :user_dba in schema func grant execute on functions to :user_ro_staff;
alter default privileges for user :user_dba in schema func grant execute on routines to :user_staff;
alter default privileges for user :user_dba in schema func grant execute on routines to :user_ro_staff;
alter default privileges for user :user_dba in schema app grant all on tables to :user_dba;
alter default privileges for user :user_dba in schema app grant all on tables to :user_app;
alter default privileges for user :user_dba in schema app grant all on tables to :user_staff;
alter default privileges for user :user_dba in schema app grant select on tables to :user_ro_app;
alter default privileges for user :user_dba in schema app grant select on tables to :user_ro_staff;
alter default privileges for user :user_dba in schema staff grant all on tables to :user_dba;
alter default privileges for user :user_dba in schema staff grant all on tables to :user_staff;
alter default privileges for user :user_dba in schema staff grant select on tables to :user_ro_staff;

alter role :user_dba set search_path = staff, app, func;
alter role :user_staff set search_path = staff, app, func;
alter role :user_ro_staff set search_path = staff, app, func;
alter role :user_app set search_path = app, func;
alter role :user_ro_app set search_path = app, func;