#!/usr/bin/env node
import * as fs from "fs";
import * as p from "path";
import {main} from "@nereid/nodemain";

export const readdirRecursiveSync = function* readdirRecursiveSync(path) {
  const files = fs.readdirSync(path);
  let stats;

  for (const file of files) {

    stats = fs.lstatSync(p.join(path, file));
    if (stats.isDirectory()) {
      yield* readdirRecursiveSync(p.join(path, file));
    } else {
      yield p.join(path, file);
    }
  }
};

main(async () => {
  for (const f of readdirRecursiveSync("src")) {
    if (!f.endsWith(".sql")) {
      continue;
    }

    const g = f.replace(/\.sql$/, ".sql.ts");
    let contents: string = fs.readFileSync(f, "utf8");
    contents = contents.replace("`", "\\`");
    contents = contents.replace("${", "\\${");
    fs.writeFileSync(`${g}`, `export const value = \`
${contents}
\`;
`);
  }
});
