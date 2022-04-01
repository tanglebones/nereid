const fs = require('fs');
const serverBlocks = [];
const staticBlocks = [];

function readdirRecursiveSync(path, cb) {
  for (const file of fs.readdirSync(path)) {
    const ff = `${path}/${file}`;
    const stats = fs.lstatSync(ff);
    if (stats.isDirectory()) {
      readdirRecursiveSync(ff, cb);
    } else {
      cb(ff);
    }
  }
}

const hostPostfix = process.env.HOST_POSTFIX ?? 'xxx';

const usedPorts = {};

const apiProxy = (hostPrefix, port) => {
  return `
  server {
    server_name ${hostPrefix}.${hostPostfix};
    listen 80;
    port_in_redirect off;
    location / {
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
      proxy_pass http://127.0.0.1:${port};
    }
  }
`;
};

const staticFiles = (domain) => {
  return `
  server {
    server_name ${domain}.${hostPostfix};
    root ../web/${domain}/dist/; # note: on *nix this probably has to be absolute path.
    location / {
      try_files $uri /index.html;
    }
  }
  `;
};

readdirRecursiveSync('../srv', (file) => {
  const m = file.match(/srv\/(?<domain>[^/]+)\/port_mapping.json$/);
  if (m) {
    const contents = fs.readFileSync(file, "utf-8");
    const mapping = JSON.parse(contents);
    for (const [subdomain, port] of Object.entries(mapping)) {
      if (port) {
        const {domain} = m.groups;
        const hostPrefix = `${subdomain}.${domain}`;
        if (usedPorts[port]) {
          throw new Error(`Port conflict: ${port} requested by ${usedPorts[port]} and ${hostPrefix}`);
        }
        usedPorts[port] = hostPrefix;
        serverBlocks.push(apiProxy(hostPrefix, port));
      }
    }
  }
});

{
  const files = fs.readdirSync('../web');

  for (const file of files) {
    const ff = `../web/${file}`;
    const stats = fs.lstatSync(ff);
    if (stats.isDirectory()) {
      staticBlocks.push(staticFiles(file));
    }
  }
}

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
     '"$http_referer" "$http_user_agent" "$gzip_ratio" "$host"';
  access_log logs/access.log custom;

  error_page 404 /404.html;
  
  map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
  }

  ${serverBlocks.join("\n")}
  ${staticBlocks.join("\n")}
}
`;

console.log("writing ./nginx.conf");
fs.writeFileSync("./nginx.conf", config);
process.exit(0);

// });
