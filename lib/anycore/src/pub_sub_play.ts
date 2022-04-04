export type pubSubPlayType<T> = {
  pub(message: T): Promise<void>,
  sub(handler: (message: T) => Promise<void>): () => void,
  play(n: number): Promise<void>,
};

/**
 * Returns a pubSubPlayCtor for use in creating pubSubPlay channels.
 * `pub` resolves immediately. `play` resolves after at most `n` messages have been handled by the subscribed handlers.
 * This is mostly useful for testing other components that use a `pubSub`.
 * @param tuidFactory
 * @param registryFactory
 */
export const pubSubPlayCtorCtor = (tuidFactory: () => string) =>
  <T>() => {
    const pendingMessages: T[] = [];
    const subs = {} as Record<string, (message: T) => Promise<void>>;

    const sub = (handler: (message: T) => Promise<void>) => {
      const id = tuidFactory();
      subs[id] = handler;
      return () => delete subs[id];
    }

    const pub = async (message: T) => {
      pendingMessages.push(message);
    };

    const play = async (n: number) => {
      if (n > pendingMessages.length) {
        n = pendingMessages.length;
      }
      if (n <= 0) {
        return;
      }
      const messages = pendingMessages.splice(0, n);

      await Promise.all(
        messages
          .map(
            message =>
              Object.values(subs)
                .map(
                  async handler => handler(message),
                ),
          )
          .flat(),
      );
    };

    return {pub, sub, play};
  };

