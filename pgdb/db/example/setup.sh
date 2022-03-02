#!/bin/bash

set -e
# todo check the ${CONFIG_ENV} and prompt for sanity if it is `main`
./schema/setup.sh
if [ -f "./seed/${CONFIG_ENV}/setup.sh" ]
then
  pushd "./seed/${CONFIG_ENV}"
  echo "loading seed for ${CONFIG_ENV}"
  ./setup.sh
  popd
fi
