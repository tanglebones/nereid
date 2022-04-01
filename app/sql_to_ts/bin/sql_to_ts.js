#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readdirRecursiveSync = void 0;
const fs = require("fs");
const nodemain_1 = require("@nereid/nodemain");
const readdirRecursiveSync = function* readdirRecursiveSync(path) {
    const files = fs.readdirSync(path);
    let stats;
    for (const file of files) {
        const fullfilename = `${path}/${file}`;
        stats = fs.lstatSync(fullfilename);
        if (stats.isDirectory()) {
            yield* readdirRecursiveSync(fullfilename);
        }
        else {
            yield fullfilename;
        }
    }
};
exports.readdirRecursiveSync = readdirRecursiveSync;
(0, nodemain_1.main)(async () => {
    for (const f of (0, exports.readdirRecursiveSync)("src")) {
        if (!f.endsWith(".sql")) {
            continue;
        }
        const g = f.replace(/\.sql$/, "_sql.ts");
        let contents = fs.readFileSync(f, "utf8");
        contents = contents.replace("`", "\\`");
        contents = contents.replace("${", "\\${");
        fs.writeFileSync(`${g}`, `export const value = \`
${contents}
\`;
`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsX3RvX3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NxbF90b190cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQ0EseUJBQXlCO0FBQ3pCLCtDQUFzQztBQUUvQixNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLElBQUk7SUFDckUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxJQUFJLEtBQUssQ0FBQztJQUVWLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLE1BQU0sWUFBWSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3ZDLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3ZCLEtBQUssQ0FBQyxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQzNDO2FBQU07WUFDTCxNQUFNLFlBQVksQ0FBQztTQUNwQjtLQUNGO0FBQ0gsQ0FBQyxDQUFDO0FBYlcsUUFBQSxvQkFBb0Isd0JBYS9CO0FBRUYsSUFBQSxlQUFJLEVBQUMsS0FBSyxJQUFJLEVBQUU7SUFDZCxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUEsNEJBQW9CLEVBQUMsS0FBSyxDQUFDLEVBQUU7UUFDM0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdkIsU0FBUztTQUNWO1FBRUQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDekMsSUFBSSxRQUFRLEdBQVcsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxFQUFFLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUU7RUFDM0IsUUFBUTs7Q0FFVCxDQUFDLENBQUM7S0FDQTtBQUNILENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQge21haW59IGZyb20gXCJAbmVyZWlkL25vZGVtYWluXCI7XG5cbmV4cG9ydCBjb25zdCByZWFkZGlyUmVjdXJzaXZlU3luYyA9IGZ1bmN0aW9uKiByZWFkZGlyUmVjdXJzaXZlU3luYyhwYXRoKSB7XG4gIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmMocGF0aCk7XG4gIGxldCBzdGF0cztcblxuICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBmdWxsZmlsZW5hbWUgPSBgJHtwYXRofS8ke2ZpbGV9YDtcbiAgICBzdGF0cyA9IGZzLmxzdGF0U3luYyhmdWxsZmlsZW5hbWUpO1xuICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB5aWVsZCogcmVhZGRpclJlY3Vyc2l2ZVN5bmMoZnVsbGZpbGVuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeWllbGQgZnVsbGZpbGVuYW1lO1xuICAgIH1cbiAgfVxufTtcblxubWFpbihhc3luYyAoKSA9PiB7XG4gIGZvciAoY29uc3QgZiBvZiByZWFkZGlyUmVjdXJzaXZlU3luYyhcInNyY1wiKSkge1xuICAgIGlmICghZi5lbmRzV2l0aChcIi5zcWxcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGcgPSBmLnJlcGxhY2UoL1xcLnNxbCQvLCBcIl9zcWwudHNcIik7XG4gICAgbGV0IGNvbnRlbnRzOiBzdHJpbmcgPSBmcy5yZWFkRmlsZVN5bmMoZiwgXCJ1dGY4XCIpO1xuICAgIGNvbnRlbnRzID0gY29udGVudHMucmVwbGFjZShcImBcIiwgXCJcXFxcYFwiKTtcbiAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoXCIke1wiLCBcIlxcXFwke1wiKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGAke2d9YCwgYGV4cG9ydCBjb25zdCB2YWx1ZSA9IFxcYFxuJHtjb250ZW50c31cblxcYDtcbmApO1xuICB9XG59KTtcbiJdfQ==