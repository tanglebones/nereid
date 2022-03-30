// istanbul ignore file
// -- todo: extract and common-ize the protocol into anycore & add tests
// -- for now this will be tested via usage in examples as the protocol is still evolving.

import {serializableType} from '@nereid/anycore';
import {DateTime, Duration} from 'luxon';

export type webSocketHandlerType = (params: serializableType) => Promise<serializableType>;

export type webSocketType = {
  call(callName: string, params: serializableType): Promise<serializableType>;
  isActive(): boolean;
  callCtor<TP extends serializableType, TR extends serializableType>(
    callName: string,
    defaultReturn?: Partial<TR & { error: string }>,
  ): (params: TP) => Promise<Partial<TR & { error: string }>>;
};

type requestType = {
  id: string,
  resolve: (r: serializableType) => void,
  reject: (r: serializableType) => void,
  data: string,
  timeoutHandle: number,
};

export let webSocketCtor = (
  tuidFactory: () => string,
  setTimeout: (cb: () => void, delayMs: number) => number,
  clearTimeout: (handle: number) => void
) => (
  domain: string,
  callRegistry: Readonly<Record<string, webSocketHandlerType>>,
  onConnectHandler?: () => void,
  onCloseHandler?: () => void,
): webSocketType => {
  const schema = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
  const wsUrl = `${schema}//${domain}/ws`;
  let ws: WebSocket | undefined;

  let lastConnectionAttemptAt = DateTime.utc().minus({minutes: 2});

  const pending = {} as Record<string, requestType>;
  const sent = {} as Record<string, requestType>;

  const isActive = () => ws?.readyState === WebSocket.OPEN;

  const processPending = () => {
    if (isActive()) {
      Object.values(pending).forEach(p => {
        ws?.send(p.data);
        sent[p.id] = p;
        delete pending[p.id];
      });
    }
  };

  const processMessage = async (data: string) => {
    const packet: {
      id?: string;
      n?: string; // name
      a?: serializableType, // args
      s?: string, // status
      e?: serializableType, // error
      r?: serializableType // result
    } = JSON.parse(data);
    const status = packet.s?.[0];
    if (packet.id && packet.n && status === '?') {
      try {
        const call = callRegistry[packet.n];
        if (call) {
          const r = await call(packet.a);
          ws?.send(JSON.stringify({
            id: packet.id,
            s: '+',
            r,
          }));
        } else {
          ws?.send(JSON.stringify({
            id: packet.id,
            s: '-NF',
          }));
        }
      } catch (e) {
        ws?.send(JSON.stringify({
          id: packet.id,
          s: '-EX',
          e,
        }));
      }
    } else if (packet.id && (status === '-' || status === '+')) {
      const req = sent[packet.id];
      delete sent[packet.id];
      if (req) {
        clearTimeout(req.timeoutHandle);
        if (status === '+') {
          req.resolve(packet.r);
        } else {
          if (packet.s === '-EX') {
            req.reject(packet.e);
          } else {
            req.reject('NOT_FOUND');
          }
        }
      }
    }
  };

  let timeoutHandle: number | undefined;

  const reconnect = () => {
    if (timeoutHandle || isActive()) {
      return;
    }

    const utc = DateTime.utc();
    const timeSinceLastConnectionAttemptAt = utc.diff(lastConnectionAttemptAt);
    if (timeSinceLastConnectionAttemptAt < Duration.fromObject({seconds: 30})) {
      const delay = timeSinceLastConnectionAttemptAt.as('milliseconds');
      timeoutHandle = setTimeout(() => {
        timeoutHandle = undefined;
        reconnect();
      }, delay);
      return;
    }

    lastConnectionAttemptAt = utc;

    console.log('reconnecting. ws.readyState is', ws?.readyState);
    try {
      ws = new WebSocket(wsUrl, ['rpc1']);
    } catch (e) {
      console.error(e);
      reconnect();
      return;
    }

    ws.onopen = () => {
      onConnectHandler?.();
      processPending();
    };

    ws.onmessage = async (ev: MessageEvent) => {
      await processMessage(ev.data as string);
    };

    ws.onclose = () => {
      console.log('ws closed', ws?.readyState);
      ws = undefined;
      onCloseHandler?.();
      reconnect();
    };

    ws.onerror = (ev: Event) => {
      console.error(ev);
      ws?.close();
    };
  };

  reconnect();

  const defaultTimeout = Duration.fromObject({minute: 1});

  const timeoutRequest = (id: string) => {
    const req = pending[id] ?? sent[id];
    delete pending[id];
    delete sent[id];
    req?.reject('TIMEOUT');
  };

  const call = async (callName: string, params: serializableType, timeout: Duration = defaultTimeout) => new Promise<serializableType>((resolve, reject) => {
    const id = tuidFactory();
    const data = JSON.stringify({id, n: callName, a: params, s: '?'});
    pending[id] = {
      id,
      resolve,
      reject,
      data,
      timeoutHandle: setTimeout(() => {
        timeoutRequest(id);
      }, timeout.as('milliseconds')),
    };

    if (isActive()) {
      processPending();
    }
  });

  const callCtor = <TP extends serializableType, TR extends serializableType>(
    callName: string,
    defaultReturn?: Partial<TR & { error: string }>,
  ): (params: TP) => Promise<Partial<TR & { error: string }>> => {
    const def = defaultReturn || {error: 'NO_REPLY'} as Partial<TR & { error: string }>;

    return async function (params: TP): Promise<Partial<TR & { error: string }>> {
      try {
        const rawReply = await call(callName, params);
        const reply = rawReply as Partial<TR & { error: string }>;
        if (!reply) {
          return def;
        }
        return reply;
      } catch (e) {
        console.error(e);
        return def;
      }
    };
  };

  return {call, callCtor, isActive};
};
