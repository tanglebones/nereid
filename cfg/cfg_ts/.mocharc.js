module.exports = {
  require: [
    "source-map-support/register", "ts-node/register",
  ],
  "full-trace": true,
  bail: true,
  spec: "src/**/*.test.cfg_ts",
};
