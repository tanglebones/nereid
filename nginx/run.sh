#!/usr/bin/env bash

function killemall {
  # windows specific find & kill running nginx.exe instances
  echo "Seaching for running nginx.exe processes to kill..."
  pids=$(tasklist //v | grep nginx.exe | tr -s ' ' | cut -d ' ' -f 2)
  if [[ ! -z $pids ]]; then
    echo $pids | xargs -n 1 taskkill //f //pid
  fi
}

function finish {
  echo "exiting..."
  killemall
}

trap finish EXIT

killemall

echo "Starting nginx"
npm run run
