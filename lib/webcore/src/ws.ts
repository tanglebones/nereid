import {serializableType} from '@nereid/anycore';
import {DateTime, Duration} from 'luxon';
import {tuidFactory} from "./tuid_factory";

export const deps = {window};
export type wsHandlerType = (params: serializableType) => Promise<serializableType>;

export type wsType = {
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

export function wsCtor(
  domain: string,
  callRegistry: Readonly<Record<string, wsHandlerType>>,
  onConnectHandler?: () => void,
  onCloseHandler?: () => void,
): wsType {
  const schema = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
  const wsUrl = `${schema}//${domain}/ws`;
  let ws: WebSocket | undefined;

  let lastConnectionAttemptAt = DateTime.utc().minus({minutes: 2});

  const pending = {} as Record<string,requestType>;
  const sent = {} as Record<string,requestType>;

  function isActive(): boolean {
    return ws?.readyState === WebSocket.OPEN;
  }

  function processPending(): void {
    if (isActive()) {
      Object.values(pending).forEach(p => {
        ws?.send(p.data);
        sent[p.id]=p;
        delete pending[p.id];
      });
    }
  }

  async function processMessage(data: string): Promise<void> {
    const i: { id?: string; n?: string; a?: serializableType, s?: string, e?: serializableType, r?: serializableType } = JSON.parse(data);
    const ss = i.s?.[0];
    if (i.id && i.n && ss === '?') {
      try {
        const call = callRegistry[i.n];
        if (call) {
          const r = await call(i.a);
          ws?.send(JSON.stringify({
            id: i.id,
            s: '+',
            r,
          }));
        } else {
          ws?.send(JSON.stringify({
            id: i.id,
            s: '-NF',
          }));
        }
      } catch (e) {
        ws?.send(JSON.stringify({
          id: i.id,
          s: '-EX',
          e,
        }));
      }
    } else if (i.id && (ss === '-' || ss === '+')) {
      const req = sent[i.id];
      delete sent[i.id];
      if (req) {
        deps.window.clearTimeout(req.timeoutHandle);
        if (ss === '+') {
          req.resolve(i.r);
        } else {
          if (i.s === '-EX') {
            req.reject(i.e);
          } else {
            req.reject('NOT_FOUND');
          }
        }
      }
    }
  }

  let timeoutHandle: number | undefined;

  function reconnect(): void {
    if (timeoutHandle || isActive()) {
      return;
    }

    const utc = DateTime.utc();
    const timeSinceLastConnectionAttemptAt = utc.diff(lastConnectionAttemptAt);
    if (timeSinceLastConnectionAttemptAt < Duration.fromObject({seconds: 30})) {
      const delay = timeSinceLastConnectionAttemptAt.as('milliseconds');
      timeoutHandle = deps.window.setTimeout(() => {
        timeoutHandle = undefined;
        reconnect();
      }, delay);
      return;
    }

    lastConnectionAttemptAt = utc;

    console.log('reconnecting. ws.readyState is', ws?.readyState);
    try {
      ws = new WebSocket(wsUrl, ['rpc_v1']);
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
  }

  reconnect();

  const defaultTimeout = Duration.fromObject({minute: 1});

  function timeoutRequest(id: string): void {
    const req = pending[id] ?? sent[id];
    delete pending[id];
    delete sent[id];
    req?.reject('TIMEOUT');
  }

  async function call(callName: string, params: serializableType, timeout: Duration = defaultTimeout): Promise<serializableType> {
    return new Promise<serializableType>((resolve, reject) => {
      const id = tuidFactory();
      const data = JSON.stringify({id, n: callName, a: params, s: '?'});
      pending[id] = {
        id,
        resolve,
        reject,
        data,
        timeoutHandle: deps.window.setTimeout(() => {
          timeoutRequest(id);
        }, timeout.as('milliseconds')),
      };

      if (isActive()) {
        processPending();
      }
    });
  }

  function callCtor<TP extends serializableType, TR extends serializableType>(
    callName: string,
    defaultReturn?: Partial<TR & { error: string }>,
  ): (params: TP) => Promise<Partial<TR & { error: string }>> {
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
  }

  return {call, callCtor, isActive};
}
