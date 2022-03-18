export type pubSubMessageHandlerType = (message: string) => Promise<void>;

export type pubSubType = {
  pub(message: string): Promise<void>,
  sub(handler: pubSubMessageHandlerType): () => void,
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
  return () => {
    const subs = {} as Record<string, pubSubMessageHandlerType>;

    const sub = (handler: pubSubMessageHandlerType) => {
      const id = tuidFactory();
      subs[id] = handler;
      return () => delete subs[id];
    }

    const pub = async (message: string) => {
      await Promise.all(Object.values(subs).map(async handler => handler(message)));
    };

    const r: pubSubType = {pub, sub};
    return r;
  };
};
