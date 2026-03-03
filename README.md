# BFH Forge Dashboard

Brave Frontier Heroes の外部APIを活用したダッシュボード＆ブラックジャックゲーム。

🌐 **Production**: https://bfh-forge-dashboard.vercel.app

## Features

- BFH OAuth2 認証
- ユニットデータ表示
- **BFH BLACKJACK** ゲーム（連勝バッジシステム付き）

## Development

```bash
npm install
npm run dev
```

ローカル開発: http://localhost:3000

## Environment Variables

`.env.local` に以下を設定:

```
NEXT_PUBLIC_API_URL=https://api.bravefrontierheroes.com
NEXT_PUBLIC_BFH_CLIENT_ID=your_client_id
BFH_CLIENT_ID=your_client_id
BFH_CLIENT_SECRET=your_client_secret
BFH_AUTH_URL=https://auth.bravefrontierheroes.com/oauth2/auth
BFH_TOKEN_URL=https://auth.bravefrontierheroes.com/oauth2/token
```

## Deploy

Vercel にデプロイ済み。`git push` で自動デプロイ。
