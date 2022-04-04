export type pubSubType<T> = {
  pub(message: T): Promise<void>,
  sub(handler: (message: T) => Promise<void>): () => void,
};

/**
 * Returns a pubSubCtor for use in creating pubSub channels.
 * `pub` resolves when all subscribed message handlers have resolved.
 *
 * In general it is not advisable to use the pubSub pattern as analysing what will happen when a message is published
 * becomes complex quickly.
 *
 * Why CtorCtor vs FactoryCtor? Because if you have dynamic pub/sub instances it is most likely not the best approach.
 * Most (if not all) pub/sub instances should be created in bootstrap. All of the subscribers should be set in
 * bootstrap as well. And if that is the case then why are you using pub/sub instead of just calling the subscribers
 * directly?
 *
 * @param tuidFactory
 */
export const pubSubCtorCtor = (tuidFactory: () => string) => {
  return <T>() => {
    const subs = {} as Record<string, (message: T) => Promise<void>>;

    const sub = (handler: (message: T) => Promise<void>) => {
      const id = tuidFactory();
      subs[id] = handler;
      return () => delete subs[id];
    }

    const pub = async (message: T) => {
      await Promise.all(Object.values(subs).map(async handler => handler(message)));
    };

    return {pub, sub} as pubSubType<T>;
  };
};


// no .default.ts as the tuidFactory changes between nodecore and webcore.
