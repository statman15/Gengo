import assert from 'node:assert/strict';
import { ruby, sentenceHtml } from './ui.js';

assert.equal(ruby('学生', 'がくせい', true), '<ruby class="on">学生<rt>がくせい</rt></ruby>');
assert.equal(ruby('学生', 'がくせい', false), '<ruby>学生<rt>がくせい</rt></ruby>'); // reading present but hidden by CSS until tapped
assert.equal(ruby('あれ', 'あれ', true), 'あれ');                                    // kana-only: never ruby
assert.equal(ruby('<b>', '"x"', true), '&#60;b&#62;');
assert.equal(ruby('学<', '<img>', true), '<ruby class="on">学&#60;<rt>&#60;img&#62;</rt></ruby>');
const s = { t: [['私', 'わたし', 'w-1'], ['は', 'は', ''], ['学生', 'がくせい', 'w-2'], ['<', '&', '.']] };
assert.equal(sentenceHtml(s, 'w-2', id => id === 'w-1'),
  '<ruby class="on">私<rt>わたし</rt></ruby>は<mark><ruby>学生<rt>がくせい</rt></ruby></mark>&#60;');
assert.equal(sentenceHtml(s, null, () => false).includes('<mark>'), false);
console.log('ui.test.js ok');
