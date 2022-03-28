#!/usr/bin/env node
import * as fs from "fs";
import {main} from "@nereid/nodemain";

export const readdirRecursiveSync = function* readdirRecursiveSync(path) {
  const files = fs.readdirSync(path);
  let stats;

  for (const file of files) {
    const fullfilename = `${path}/${file}`;
    stats = fs.lstatSync(fullfilename);
    if (stats.isDirectory()) {
      yield* readdirRecursiveSync(fullfilename);
    } else {
      yield fullfilename;
    }
  }
};

main(async () => {
  for (const f of readdirRecursiveSync("src")) {
    if (!f.endsWith(".sql")) {
      continue;
    }

    const g = f.replace(/\.sql$/, "_sql.ts");
    let contents: string = fs.readFileSync(f, "utf8");
    contents = contents.replace("`", "\\`");
    contents = contents.replace("${", "\\${");
    fs.writeFileSync(`${g}`, `export const value = \`
${contents}
\`;
`);
  }
});
