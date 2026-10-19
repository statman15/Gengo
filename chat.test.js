import assert from 'node:assert/strict';
import { parseTurn, parseGrade, rating, messages, gradeMessages, replies } from './chat.js';

const words = [{ id: 'w-1', r: 'みず', w: '水', m: ['water'] }, { id: 'w-2', r: 'おちゃ', w: 'お茶', m: ['tea'] }, { id: 'w-3', r: 'はい', w: '', m: ['yes'] }];
const t = parseTurn('```json\n{"who":"teahouse owner","jp":"いらっしゃいませ。","en":"Welcome.","hint":"おちゃを ください。"}\n```');
assert.deepEqual(t, { jp: 'いらっしゃいませ。', en: 'Welcome.', hint: 'おちゃを ください。', who: 'teahouse owner' });
assert.throws(() => parseTurn('{"en":"no jp"}'));

const log = [{ jp: 'a' }, { me: true, jp: 'おちゃ' }, { jp: 'b' }, { me: true, jp: 'みず', helped: true }];
const g = parseGrade('{"words":[{"n":1,"used":"right","reply":2},{"n":2,"used":"right","reply":1},{"n":9,"used":"right"}],"fixes":[{"reply":1,"fix":"おちゃを ください","why":"Add を"},{"fix":""}],"note":"Nice!"}', words);
assert.deepEqual(g.words['w-3'], { used: 'no', reply: 0 }, 'missing word counts as not used');
assert.equal(g.fixes.length, 1, 'empty fixes dropped');
assert.equal(rating(g.words['w-1'], log), 2, 'used in a suggested reply: Hard');
assert.equal(rating(g.words['w-2'], log), 3, 'used on its own: Good');
assert.equal(rating({ used: 'wrong', reply: 1 }, log), 1);
assert.equal(rating(g.words['w-3'], log), null, 'not used: no review');
assert.equal(replies({ log }), 2);

const c = { station: { jp: '吉原', name: 'Yoshiwara', scene: 'A road' }, log };
const m = messages(c, words, { 'g-wa-desu': {} });
assert.equal(m.length, 2 + log.length);
assert.ok(m[0].content.includes('1. みず (水): water') && m[0].content.includes('XはYです') && m[0].content.includes('吉原'));
assert.deepEqual(m.slice(2).map(x => x.role), ['assistant', 'user', 'assistant', 'user']);
assert.ok(gradeMessages(c, words)[1].content.includes('Learner (reply 2): みず'));
console.log('chat ok');
import { saved, keep } from './chat.js';
keep({ day: 'd', ids: null, log: [null] }); assert.equal(saved('d'), null, 'a broken cached chat is ignored');
console.log('chat guards ok');
