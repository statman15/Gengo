const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS', 'access-control-allow-headers': 'Content-Type' };
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
const reply = (body, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: CORS });
const num = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;

// Returns the whitelisted record, or null if the body is invalid.
function clean(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return null;
  const { name, streak, week, mastered, station, race } = b;
  if (typeof name !== 'string' || name.length < 1 || name.length > 20) return null;
  if (![streak, week, mastered, station].every(num)) return null;
  if (race !== null && !(race && typeof race.day === 'string' && /^\d{4}-\d\d-\d\d$/.test(race.day) && num(race.time))) return null;
  return { name, streak, week, mastered, station, race: race && { day: race.day, time: race.time } };
}

export async function handle(req, env) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const [root, code, dev] = new URL(req.url).pathname.split('/').slice(1);
  if (root !== 'group') return reply(undefined, 404);
  if (req.method === 'POST' && !code) {
    const id = [...crypto.getRandomValues(new Uint8Array(10))].map(n => ALPHA[n % ALPHA.length]).join('');
    await env.GENGO.put('g:' + id, '1');
    return reply({ code: id });
  }
  if (!code || !(await env.GENGO.get('g:' + code))) return reply(undefined, 404);
  if (req.method === 'GET' && !dev) {
    const { keys } = await env.GENGO.list({ prefix: `m:${code}:` });
    return reply((await Promise.all(keys.map(k => env.GENGO.get(k.name)))).filter(Boolean).map(JSON.parse));
  }
  if (req.method === 'PUT' && /^[A-Za-z0-9-]{8,64}$/.test(dev || '')) {
    const text = await req.text();
    let rec;
    try { rec = text.length <= 1024 && clean(JSON.parse(text)); } catch {}
    if (!rec) return reply(undefined, 400);
    await env.GENGO.put(`m:${code}:${dev}`, JSON.stringify({ ...rec, t: Date.now() }));
    return reply(undefined, 204);
  }
  return reply(undefined, dev || req.method === 'PUT' ? 400 : 404);
}

export default { fetch: (req, env) => handle(req, env) };
