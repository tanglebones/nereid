const fs = require('fs');
const {exec} = require("child_process");

const hostMappings = [];

function readdirRecursiveSync(path, cb) {
  const files = fs.readdirSync(path);
  let stats;

  for (const file of files) {
    const ff = `${path}/${file}`;
    stats = fs.lstatSync(ff);
    if (stats.isDirectory()) {
      readdirRecursiveSync(ff, cb);
    } else {
      cb(ff);
    }
  }
}

const hostPostfix = process.env.HOST_POSTFIX ?? 'xxx';

readdirRecursiveSync('../srv', (file) => {

  const m = file.match(/srv\/(?<domain>[^/]+)\/.port$/);
  if (m) {
    const contents = fs.readFileSync(file, "utf-8");
    console.log(file, contents);
    const port = +(contents.split(/[\n\r]/)?.[0]);
    if (port) {
      const {domain} = m.groups;
      hostMappings.push(`    api.${domain}.${hostPostfix} ${port};`)
    }
  }
});

// this works in msys2 on windows... it won't work on linux!
// nginx on linux won't accept a relative path for a root
// nginx on windows won't accept a /c/ style abs path ... so /shrug

// exec("sh -c pwd", (err, cwd) => {
//   if (err) {
//     console.error(err);
//     process.exit(1);
//   }
//   const cwdParts = cwd.trim().split('/');
//   cwdParts.pop();
//   cwd = cwdParts.join('/');
  const hostMap = hostMappings.join('\n');

  const config = `
worker_processes 1;
error_log stderr;
daemon off;

events {
    worker_connections 1024;
}

http {
  include mime.types;
  default_type text/plain;
  
  log_format custom '$remote_addr - $remote_user [$time_local] '
     '"$request" $status $body_bytes_sent '
     '"$http_referer" "$http_user_agent" "$gzip_ratio" "$host" "$domain" $localport';
  access_log logs/access.log custom;

  map $http_upgrade $connection_upgrade {
      default upgrade;
      '' close;
  }

  map $http_host $localport {
    hostnames;

    default 0;
${hostMap}
  }

  error_page 404 /404.html;

  server {
    listen 80;
    port_in_redirect off;

    if ($host ~* ([^.]+)\\.${hostPostfix}$) {
      set $domain $1;
    }

    location ~ / {
      index index.html;
      proxy_read_timeout 300;
      proxy_connect_timeout 300;
      proxy_http_version 1.1;
      proxy_intercept_errors on;
      proxy_pass_header  Set-Cookie;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_set_header   Host              $http_host;
      proxy_set_header   X-Forwarded-For   $remote_addr;
      proxy_set_header   Upgrade           $http_upgrade;
      proxy_set_header   Connection        $connection_upgrade;

      if ($localport = 0) {
        root ../web/$domain/dist/;
      }

      if ($localport != 0) {
        proxy_pass http://127.0.0.1:$localport;
      }
    }
  }
}
`;

  console.log("writing ./nginx.conf");
  fs.writeFileSync("./nginx.conf", config);
  process.exit(0);

// });
