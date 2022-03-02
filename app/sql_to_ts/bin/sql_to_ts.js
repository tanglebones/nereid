#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readdirRecursiveSync = void 0;
const fs = require("fs");
const p = require("path");
const nodemain_1 = require("@nereid/nodemain");
const readdirRecursiveSync = function* readdirRecursiveSync(path) {
    const files = fs.readdirSync(path);
    let stats;
    for (const file of files) {
        stats = fs.lstatSync(p.join(path, file));
        if (stats.isDirectory()) {
            yield* readdirRecursiveSync(p.join(path, file));
        }
        else {
            yield p.join(path, file);
        }
    }
};
exports.readdirRecursiveSync = readdirRecursiveSync;
(0, nodemain_1.main)(async () => {
    for (const f of (0, exports.readdirRecursiveSync)("src")) {
        if (!f.endsWith(".sql")) {
            continue;
        }
        const g = f.replace(/\.sql$/, ".sql.ts");
        let contents = fs.readFileSync(f, "utf8");
        contents = contents.replace("`", "\\`");
        contents = contents.replace("${", "\\${");
        fs.writeFileSync(`${g}`, `export const value = \`
${contents}
\`;
`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsX3RvX3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NxbF90b190cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQ0EseUJBQXlCO0FBQ3pCLDBCQUEwQjtBQUMxQiw0Q0FBbUM7QUFFNUIsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJO0lBQ3JFLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsSUFBSSxLQUFLLENBQUM7SUFFVixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtRQUV4QixLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3ZCLEtBQUssQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDakQ7YUFBTTtZQUNMLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUI7S0FDRjtBQUNILENBQUMsQ0FBQztBQWJXLFFBQUEsb0JBQW9CLHdCQWEvQjtBQUVGLElBQUEsZUFBSSxFQUFDLEtBQUssSUFBSSxFQUFFO0lBQ2QsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFBLDRCQUFvQixFQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzNDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZCLFNBQVM7U0FDVjtRQUVELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLElBQUksUUFBUSxHQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QyxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFO0VBQzNCLFFBQVE7O0NBRVQsQ0FBQyxDQUFDO0tBQ0E7QUFDSCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHttYWlufSBmcm9tIFwiQG53bS9ub2RlbWFpblwiO1xuXG5leHBvcnQgY29uc3QgcmVhZGRpclJlY3Vyc2l2ZVN5bmMgPSBmdW5jdGlvbiogcmVhZGRpclJlY3Vyc2l2ZVN5bmMocGF0aCkge1xuICBjb25zdCBmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHBhdGgpO1xuICBsZXQgc3RhdHM7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG5cbiAgICBzdGF0cyA9IGZzLmxzdGF0U3luYyhwLmpvaW4ocGF0aCwgZmlsZSkpO1xuICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB5aWVsZCogcmVhZGRpclJlY3Vyc2l2ZVN5bmMocC5qb2luKHBhdGgsIGZpbGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgeWllbGQgcC5qb2luKHBhdGgsIGZpbGUpO1xuICAgIH1cbiAgfVxufTtcblxubWFpbihhc3luYyAoKSA9PiB7XG4gIGZvciAoY29uc3QgZiBvZiByZWFkZGlyUmVjdXJzaXZlU3luYyhcInNyY1wiKSkge1xuICAgIGlmICghZi5lbmRzV2l0aChcIi5zcWxcIikpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGcgPSBmLnJlcGxhY2UoL1xcLnNxbCQvLCBcIi5zcWwudHNcIik7XG4gICAgbGV0IGNvbnRlbnRzOiBzdHJpbmcgPSBmcy5yZWFkRmlsZVN5bmMoZiwgXCJ1dGY4XCIpO1xuICAgIGNvbnRlbnRzID0gY29udGVudHMucmVwbGFjZShcImBcIiwgXCJcXFxcYFwiKTtcbiAgICBjb250ZW50cyA9IGNvbnRlbnRzLnJlcGxhY2UoXCIke1wiLCBcIlxcXFwke1wiKTtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGAke2d9YCwgYGV4cG9ydCBjb25zdCB2YWx1ZSA9IFxcYFxuJHtjb250ZW50c31cblxcYDtcbmApO1xuICB9XG59KTtcbiJdfQ==