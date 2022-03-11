import {ctxCtor, ctxBody, ctxHost} from './ctx';
import assert from 'assert';
import {ctxType} from './server.type';
import {dbProviderStub} from './db/db_provider.stub';
import sinon from 'sinon';
import {parseUrl} from "./parse_url";
import {parseCookie} from "./parse_cookie";

function commonChecks(ctx: ctxType, res: any, req: any) {
  assert.strictEqual(ctx.sessionId, '');
  assert.strictEqual(ctx.user, undefined);
  assert.deepStrictEqual(ctx.session, {});
  assert.strictEqual(ctx.res, res);
  assert.strictEqual(ctx.req, req);
}

describe('ctxCtor', () => {
  it('basics', async () => {
    const req: any = {
      url: '/hello?a=1&b=2',
      headers: {
        cookie: 'c=3; d=4',
      },
      connection: {remoteAddress: 'aoeu'},
    };
    const res: any = {};
    const db = dbProviderStub(sinon);
    const ctx = ctxCtor(req, res, db.dbProvider, {} as any);
    commonChecks(ctx, res, req);
    assert.deepStrictEqual(ctx.url, {path: '/hello', params: [['a', '1'], ['b', '2']]});
    assert.deepStrictEqual(ctx.cookie, [['c', '3'], ['d', '4']]);
    assert.strictEqual(ctx.remoteAddress, 'aoeu');
  });

  it('no url', async () => {
    const req: any = {
      url: undefined,
      headers: {
        cookie: '',
      },
    };
    const res: any = {};
    const db = dbProviderStub(sinon);
    const ctx = ctxCtor(req, res, db.dbProvider, {} as any);

    commonChecks(ctx, res, req);
    assert.deepStrictEqual(ctx.url, {path: '/', params: []});
    assert.deepStrictEqual(ctx.cookie, []);
  });

  it('Nothing', () => {
    assert.deepStrictEqual(parseUrl(''), {path: '/', params: []});
  });

  it('No query params', () => {
    assert.deepStrictEqual(parseUrl('/hello'), {path: '/hello', params: []});
  });

  it('No cookie', () => {
    assert.deepStrictEqual(parseCookie(''), []);
  });

  it('Bad cookie', () => {
    assert.deepStrictEqual(parseCookie('a=; b; '), [['a', ''], ['b', ''], ['', '']]);
  });

  it('Bad params', () => {
    assert.deepStrictEqual(parseUrl('?c&d=&'), {path: '/', params: [['c', ''], ['d', ''], ['', '']]});
  });
});

describe('ctxBody', () => {
  it('Sets ctx.body', async () => {
    const onStub = (step: string, callback: (data?: string) => void) => {
      if (step === 'data') {
        callback('chunk_mock');
      } else {
        callback();
      }

      onStub.callCount++;
    }
    onStub.callCount = 0

    const ctxStub = {
      body: undefined,
      req: <any>{
        on: onStub,
        method: 'POST',
      },
      res: <any>{
        setHeader: sinon.stub(),
        end: sinon.stub(),
      },
    }

    assert.strictEqual(await ctxBody(ctxStub), true);
    assert.strictEqual(ctxStub.req.on.callCount, 2);
    assert.strictEqual(ctxStub.body, 'chunk_mock');
  });

  it('Resolves true if there is already a ctx.body', async () => {
    const ctxStub = {
      body: "Shredder!! Why haven't you completed my new body!?",
      req: <any>{},
      res: <any>{},
    }

    assert.strictEqual(await ctxBody(ctxStub), true);
  });

  it('Resolves false if there is no ctx.body and the request is not a POST', async () => {
    const ctxStub = {
      req: <any>{},
      res: <any>{
        setHeader: sinon.stub(),
        end: sinon.stub(),
      },
    }

    assert.strictEqual(await ctxBody(ctxStub), false);
    assert.strictEqual(ctxStub.res.statusCode, 405);
    sinon.assert.calledOnceWithExactly(ctxStub.res.setHeader, 'Content-Type', 'text/plain');
    sinon.assert.calledOnceWithExactly(ctxStub.res.end);
  });

  it('Returns false if there is no ctx.body and the request is a POST, but the request is too long', async () => {
    const onStub = (step: string, callback: (data?: string) => void) => {
      if (step === 'data') {
        callback('large_chunk_mock');
      } else {
        callback();
      }

      onStub.callCount++;
    }
    onStub.callCount = 0

    const ctxStub = {
      req: <any>{
        on: onStub,
        method: 'POST',
      },
      res: <any>{
        setHeader: sinon.stub(),
        end: sinon.stub(),
      },
    }

    assert.strictEqual(await ctxBody(ctxStub, 10), false);
    assert.strictEqual(ctxStub.req.on.callCount, 2);
    assert.strictEqual(ctxStub.res.statusCode, 413);
    sinon.assert.calledOnceWithExactly(ctxStub.res.setHeader, 'Content-Type', 'text/plain');
    sinon.assert.calledOnceWithExactly(ctxStub.res.end);
  });
});

describe('ctxHost', () => {
  it('Sets ctx.host', async () => {
    const ctxStub = {
      host: undefined,
      req: <any>{
        headers: {
          host: 'sub.domain.tld'
        },
      },
      res: <any>{},
    }

    ctxHost(ctxStub);
    assert.strictEqual(ctxStub.host, 'domain.tld');
  });

  it('Does nothing if there is already a host', async () => {
    const ctxStub = {
      host: 'domain.tld',
      req: <any>{},
      res: <any>{},
    }

    ctxHost(ctxStub);
    assert.strictEqual(ctxStub.host, 'domain.tld');
  });
});
