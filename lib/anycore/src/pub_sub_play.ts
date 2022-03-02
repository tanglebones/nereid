import {registryType} from "./registry";
import {pubSubMessageHandlerType} from "./pub_sub";

export type pubSubPlayType = {
  pub(message: string): Promise<void>,
  sub(handler: pubSubMessageHandlerType): () => void,
  play(n: number): Promise<void>,
};

/**
 * Returns a pubSubPlayCtor for use in creating pubSubPlay channels.
 * `pub` resolves immediately. `play` resolves after at most `n` messages have been handled by the subscribed handlers.
 * This is mostly useful for testing other components that use a `pubSub`.
 * @param tuidFactory
 * @param registryFactory
 */
export const pubSubPlayCtorCtor = (tuidFactory: () => string, registryFactory: <T>() => registryType<T>) =>
  () => {
    const subs = registryFactory<pubSubMessageHandlerType>();
    const pendingMessages: string[] = [];

    const sub = (handler: pubSubMessageHandlerType) => subs.register(tuidFactory(), handler);

    const pub = async (message: string)=> {
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
              subs
                .values
                .map(
                  async handler => handler(message),
                ),
          )
          .flat(),
      );
    };

    const r: pubSubPlayType = {pub, sub, play};
    return r;
  };

