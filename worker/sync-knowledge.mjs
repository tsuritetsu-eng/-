/**
 * GitHub Pages のWiki HTMLを取得し、OpenAI Vector Storeへ登録する簡易同期スクリプト。
 *
 * 環境変数:
 *   OPENAI_API_KEY
 *   VECTOR_STORE_ID
 *   WIKI_URL (任意)
 *
 * 実行:
 *   node sync-knowledge.mjs
 */

import fs from "node:fs/promises";

const apiKey = process.env.OPENAI_API_KEY;
const vectorStoreId = process.env.VECTOR_STORE_ID;
const wikiUrl =
  process.env.WIKI_URL ||
  "https://tsuritetsu-eng.github.io/untroddent-wiki/";

if (!apiKey || !vectorStoreId) {
  throw new Error("OPENAI_API_KEY と VECTOR_STORE_ID を設定してください。");
}

const html = await fetch(wikiUrl).then(async r => {
  if (!r.ok) throw new Error(`Wiki取得失敗: ${r.status}`);
  return r.text();
});

const text = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "\n")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "\n")
  .replace(/<[^>]+>/g, "\n")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/[ \t]+/g, " ")
  .replace(/\n\s*\n+/g, "\n")
  .trim();

await fs.mkdir("knowledge", { recursive: true });
await fs.writeFile("knowledge/wiki-latest.md", `# アントロデン Wiki\n\n${text}\n`, "utf8");

const fileBytes = await fs.readFile("knowledge/wiki-latest.md");
const form = new FormData();
form.append(
  "file",
  new Blob([fileBytes], { type: "text/markdown" }),
  "wiki-latest.md"
);
form.append("purpose", "assistants");

const fileRes = await fetch("https://api.openai.com/v1/files", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}` },
  body: form
});
const fileData = await fileRes.json();

if (!fileRes.ok) {
  throw new Error(JSON.stringify(fileData));
}

const attachRes = await fetch(
  `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file_id: fileData.id
    })
  }
);

const attachData = await attachRes.json();

if (!attachRes.ok) {
  throw new Error(JSON.stringify(attachData));
}

console.log("同期完了:", {
  file_id: fileData.id,
  vector_store_file_id: attachData.id
});
