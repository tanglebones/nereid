// istanbul ignore file
// -- todo: extract and common-ize the protocol into anycore & add tests
// -- for now this will be tested via usage in examples as the protocol is still evolving.

import {serializableType} from '@nereid/anycore';
import {DateTime, Duration} from 'luxon';
import {pubSubCtor} from "./pub_sub.default";

// WebSocket is globally defined, like window. DO NOT `import WebSocket as 'ws';` !!!

export type webSocketType = {
  call(callName: string, params: serializableType): Promise<serializableType>;
};

export type webSocketModuleType = {
  name: string,
  mode: 'client',
  calls: Readonly<Record<string, (params: serializableType) => Promise<serializableType>>>
};

export type webSocketRpcType = {
  isActive(): boolean;
  addModule: (module: webSocketModuleType) => void;
  onConnect: (callback: () => Promise<void>) => () => void;
  onClose: (callback: () => Promise<void>) => () => void;
  call: (module: string, method: string, args: serializableType, timeout?: Duration) => Promise<serializableType | undefined>;
};

type requestType = {
  id: string,
  resolve: (r: serializableType) => void,
  reject: (r: serializableType) => void,
  data: string,
  timeoutHandle: number,
};

export let webSocketFactoryCtor = (
  tuidFactory: () => string,
  setTimeout: (cb: () => void, delayMs: number) => number,
  clearTimeout: (handle: number) => void
) => (
  domain: string,
  onError: (message: string) => void,
): webSocketRpcType => {
  const schema = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
  const wsUrl = `${schema}//${domain}/ws`;
  let ws: WebSocket | undefined;

  const onClosePubSub = pubSubCtor<void>();
  const onConnectPubSub = pubSubCtor<void>();
  const modules = {} as Record<string, webSocketModuleType>;

  let lastConnectionAttemptAt = DateTime.utc().minus({minutes: 2});

  const pending = {} as Record<string, requestType>;
  const sent = {} as Record<string, requestType>;

  const isActive = () => {
    return ws?.readyState === WebSocket.OPEN;
  };

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
      m?: string;
      n?: string; // name
      a?: serializableType, // args
      s?: string, // status
      e?: serializableType, // error
      r?: serializableType // result
    } = JSON.parse(data);
    const status = packet.s?.[0];
    if (packet.id && packet.m && packet.n && status === '?') {
      try {
        const call = modules[packet.m]?.calls[packet.n];
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
    const active = isActive();
    console.log('reconnect: ws.readyState is', ws?.readyState, 'active is', active);

    if (timeoutHandle || active) {
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

    try {
      ws = new WebSocket(wsUrl, ['rpc1']);
    } catch (e) {
      onError(`${e}`);
      reconnect();
      return;
    }

    ws.onopen = () => {
      onConnectPubSub.pub();
      processPending();
    };

    ws.onmessage = (event: MessageEvent) => {
      // noinspection JSIgnoredPromiseFromCall
      processMessage(event.data as string);
    };

    ws.onclose = () => {
      ws = undefined;
      onClosePubSub.pub();
      reconnect();
    };

    ws.onerror = (ev: Event) => {
      onError(`${ev}`);
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

  const call = async (module: string, name: string, args: serializableType, timeout: Duration = defaultTimeout) => new Promise<serializableType>((resolve, reject) => {
    const id = tuidFactory();
    const data = JSON.stringify({id, m: module, n: name, a: args, s: '?'});
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

  const onClose = (callback: () => Promise<void>) => onClosePubSub.sub(callback);
  const onConnect = (callback: () => Promise<void>) => onConnectPubSub.sub(callback);

  const addModule = (module: webSocketModuleType) => {
    if (modules.hasOwnProperty(module.name)) {
      throw new Error(`Module ${module.name} already added.`);
    }
    if (module.mode !== 'client') {
      throw new Error(`Module ${module.name} is not a client module.`);
    }
    modules[module.name] = module;
  };
  return {addModule, onClose, onConnect, call, isActive};
};
