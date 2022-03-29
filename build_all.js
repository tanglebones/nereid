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

const assignBuildOrder = (name, pathToRoot = []) => {
  const module = moduleByName[name];
  if (module.buildOrder !== undefined) {
    if (module.buildOrder === -1) {
      console.log(`echo Cycle: ${pathToRoot.join(' -> ')} -> ${name}`);
      process.exit(-1);
    }
    return;
  }
  const deps = module.pj.dependencies;
  if (deps) {
    module.buildOrder = -1; // prevent cycles
    for (let dep of Object.keys(deps)) {
      if (moduleByName.hasOwnProperty(dep)) {
        assignBuildOrder(dep, [...pathToRoot, name]);
      }
    }
  }
  module.buildOrder = buildIndex++;
};

for (const m of modules) {
  assignBuildOrder(m.name);
}


const inBuildOrder = modules.sort((a, b) => a.buildOrder < b.buildOrder ? -1 : a.buildOrder > b.buildOrder ? 1 : 0);
const commands = [];
for (const m of inBuildOrder) {
  commands.push(`pushd ${m.path}`);

  for (const preBuild in ['clean','sql_to_ts','lint']) {
    if (m.pj.scripts[preBuild] !== undefined) {
      commands.push(`npm run ${preBuild}`);
    }
  }

  commands.push(`npm run build`);

  if (m.pj.scripts.cover !== undefined) {
    commands.push(`npm run cover`);
  } else if (m.pj.scripts.test !== undefined) {
    commands.push(`npm run test`);
  }

  commands.push('popd');
}

console.log(`set -ex; ${commands.join(' && ')}`);

process.exit(0);
