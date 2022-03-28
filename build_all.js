const fs = require("fs");

const readdirRecursiveSync = function* readdirRecursiveSync(path) {
  const files = fs.readdirSync(path);
  let stats;

  for (const file of files) {
    const fullfilename = `${path}/${file}`;
    stats = fs.lstatSync(fullfilename);
    if (stats.isDirectory()) {
      if (file === 'node_modules' || file[0] === '.') {
        continue;
      }
      yield* readdirRecursiveSync(fullfilename);
    } else {
      yield {path, file, fullfilename};
    }
  }
};

const moduleByName = {};
const modules = [];

for (const {path, file, fullfilename} of readdirRecursiveSync(".")) {
  if (file === 'package.json' && path !== '.') {
    const pj = require(fullfilename);
    const name = pj.name;
    if (name && pj?.scripts.build) {
      const moduleId = modules.length;
      modules[moduleId] = {
        name,
        pj,
        path
      };
      moduleByName[name] = modules[moduleId];
    }
  }
}

let buildIndex = 0;

const assignBuildOrder = (name) => {
  const module = moduleByName[name];
  if (module.buildOrder !== undefined) {
    return;
  }
  const deps = module.pj.dependencies;
  if (deps) {
    module.buildOrder = -1;
    for (let dep of Object.keys(deps)) {
      if (moduleByName.hasOwnProperty(dep)) {
        assignBuildOrder(dep);
      }
    }
  }
  module.buildOrder = buildIndex++;
};

for (const m of modules) {
  assignBuildOrder(m.name);
}


const inBuildOrder = modules.sort((a, b) => a.buildOrder < b.buildOrder ? -1 : a.buildOrder > b.buildOrder ? 1 : 0);
for (const m of inBuildOrder) {
  const clean = m.pj.scripts.clean !== undefined;
  const sql_to_ts = m.pj.scripts.sql_to_ts !== undefined;
  console.log(`pushd ${m.path} && ${clean?"npm run clean && ":""}${sql_to_ts?"npm run sql_to_ts && ":""}npm run build && popd`);
}

process.exit(0);
