import assert from 'node:assert/strict';
import { handle } from './index.js';

const kv = new Map(), opts = new Map();
const env = { GENGO: {
  get: async k => kv.get(k) ?? null,
  put: async (k, v, o) => { kv.set(k, v); opts.set(k, o); },
  list: async ({ prefix }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }),
} };
const call = (method, path, body) => handle(new Request('http://x' + path, { method, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), env);
const stats = (o = {}) => ({ name: 'Chris', streak: 3, week: 5, mastered: 10, station: 2, race: null, ...o });

const created = await call('POST', '/group');
assert.equal(created.status, 200);
assert.equal(created.headers.get('access-control-allow-origin'), '*');
const { code } = await created.json();
assert.match(code, /^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/);

assert.equal((await call('PUT', `/group/${code}/device-aaa1`, stats())).status, 204);
assert.equal((await call('PUT', `/group/${code}/device-bbb2`, stats({ race: { day: '2026-10-17', time: 42.5 }, junk: 1 }))).status, 204);
const list = await (await call('GET', `/group/${code}`)).json();
assert.equal(list.length, 2);
assert.ok(list.every(m => m.name === 'Chris' && typeof m.t === 'number' && !('junk' in m)));
assert.deepEqual(list.map(m => m.race), [null, { day: '2026-10-17', time: 42.5 }]);

assert.equal((await call('PUT', '/group/abcdefghjk/device-aaa1', stats())).status, 404);
assert.equal((await call('GET', '/group/abcdefghjk')).status, 404);
for (const bad of [stats({ name: '' }), stats({ name: 'x'.repeat(21) }), stats({ week: -1 }), stats({ streak: 'a' }), stats({ mastered: Infinity }),
  stats({ race: { day: 'today', time: 1 } }), stats({ race: { day: '2026-10-17', time: -1 } }), stats({ pad: 'x'.repeat(2048) }), '{nope', 'null'])
  assert.equal((await call('PUT', `/group/${code}/device-aaa1`, bad)).status, 400, JSON.stringify(bad).slice(0, 60));
assert.equal((await call('PUT', `/group/${code}/bad_id`, stats())).status, 400);
assert.equal((await call('PUT', `/group/${code}/short`, stats())).status, 400);

assert.equal(opts.get('g:' + code).expirationTtl, 365 * 86400);
assert.equal(opts.get(`m:${code}:device-aaa1`).expirationTtl, 90 * 86400);
for (let i = 2; i < 20; i++) assert.equal((await call('PUT', `/group/${code}/device-${String(i).padStart(4, '0')}`, stats())).status, 204);
assert.equal((await call('PUT', `/group/${code}/device-extra1`, stats())).status, 403);
assert.equal((await call('PUT', `/group/${code}/device-aaa1`, stats({ streak: 9 }))).status, 204);

const pre = await call('OPTIONS', '/group');
assert.equal(pre.status, 204);
assert.match(pre.headers.get('access-control-allow-methods'), /PUT/);
assert.match(pre.headers.get('access-control-allow-headers'), /Content-Type/);
assert.equal((await call('GET', '/nope')).status, 404);
console.log('worker ok');
