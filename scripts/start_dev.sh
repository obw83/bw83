#!/bin/bash
set -e  # エラーが出たらスクリプト停止

echo "==== Start: Dev環境セットアップ ===="

# プロジェクトルートに移動（適宜パスを変更）
cd /Users/lapis/git/neon/for_Mr-Ohmori
echo "プロジェクトルートに移動: $(pwd)"

# Node バージョン切替
echo "nvm use..."
nvm use || { echo "nvm use に失敗"; exit 1; }

# 依存パッケージ確認 / インストール
echo "npm install..."
npm install || { echo "npm install に失敗"; exit 1; }

# 開発サーバー起動
echo "npm run dev で Eleventy 開発サーバー起動"
npm run dev

echo "==== Dev環境セットアップ 完了 ===="