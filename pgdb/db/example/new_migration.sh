#!/bin/bash
set -e

if [[ $1 =~ ^[a-z0-9_]+$ ]]
then
  d=$(date "+%Y%m%d%H%M%S")
  echo "creating: ./migration/${d}_$1.sql"
  touch "./migration/${d}_$1.sql]"
else
  echo "provide a name that is all lower case, digits, and underscores. i.e. matches /^[a-z0-9_]+$/"
  exit
fi
