// sigh, doesn't work when using mocha for tests :(

declare module '*.sql' {
  const content: string;
  export default content;
}
