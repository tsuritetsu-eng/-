# UNTRODDENT GUIDE + Wiki AI

GitHub Pagesで公開するための構成です。

## フォルダ構成

```text
.
├── docs/
│   └── index.html        ← GitHub Pagesで公開するWiki
├── worker/
│   ├── worker.js         ← OpenAI API用バックエンド
│   ├── sync-knowledge.mjs
│   └── knowledge/
│       └── wiki-current.txt
└── README.md
```

## GitHub Pages

GitHubリポジトリの Settings → Pages で、

- Source: Deploy from a branch
- Branch: main
- Folder: `/docs`

を選択してください。

これで `docs/index.html` がGitHub Pagesの公開ページになります。

## Wiki AIの接続

`docs/index.html` 内の

```js
const API_URL="https://YOUR-WORKER.workers.dev";
```

を、実際にデプロイしたCloudflare WorkerのURLへ変更してください。

## OpenAI APIキーについて

APIキーを `docs/index.html` に書かないでください。

APIキーはCloudflare Worker側のSecretとして設定します。

Worker側で必要な値:

- `OPENAI_API_KEY` — Secret
- `VECTOR_STORE_ID` — Vector Store ID
- `OPENAI_MODEL` — 使用モデル（任意）
- `ALLOWED_ORIGIN` — GitHub PagesのURL（任意）

## 注意

GitHub Pagesは静的サイトなので、OpenAI APIキーをHTMLへ直接埋め込む構成にはしていません。
Wiki本体とAIバックエンドを分離しています。
