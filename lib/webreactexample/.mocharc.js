module.exports = {
  require: [
    "source-map-support/register",
    "ts-node/register",
    "jsdom-global/register",
  ],
  "full-trace": true,
  bail: true,
  extensions: ["ts", "tsx"],
  spec: "src/**/*.test.ts",
};
