/* eslint-disable no-console */

export const main = ((() => {
  process.on(
    "unhandledRejection",
    (error: Error) => {
      console.error(
        `unhandledRejection: ${error.message}\n${error.stack}`,
        error.stack,
      );
    },
  );
  return (f: () => Promise<unknown>) => {
    (async function () {
      try {
        await f();
      } catch (e) {
        console.error(e);
        process.exit(-1);
      }
      console.log("done");
      process.exit(0);
    })();
  };
})());

