import test from "node:test";
import assert from "node:assert/strict";
import { formatMessageContent } from "../public/chat-markdown.js";

test("renders markdown tables, ordered lists, headings and quotes", () => {
  const html = formatMessageContent(`1️⃣ कम-इन्वेस्टमेंट से शुरुआत करें\n\n| कारण | असर |\n|---|---|\n| सीमित पूंजी | कम जोखिम |\n\n1. पहले परीक्षण करें\n2. फिर scale करें\n\n> स्मार्ट रणनीति`);
  assert.match(html, /<h2>1️⃣ कम-इन्वेस्टमेंट से शुरुआत करें<\/h2>/u);
  assert.match(html, /<table>[\s\S]*<th scope="col">कारण<\/th>[\s\S]*कम जोखिम/);
  assert.match(html, /<ol><li>पहले परीक्षण करें<\/li><li>फिर scale करें<\/li><\/ol>/);
  assert.match(html, /<blockquote>स्मार्ट रणनीति<\/blockquote>/);
});

test("escapes unsafe markup while preserving inline markdown", () => {
  const html = formatMessageContent("**Bold** <script>alert(1)</script> and `x < y`");
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /<code>x &lt; y<\/code>/);
});
