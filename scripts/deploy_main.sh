#!/bin/bash
set -e  # エラーで停止

echo "==== Start: dev → main 反映 ===="

# プロジェクトルートに移動
cd /Users/lapis/git/neon/for_Mr-Ohmori
echo "プロジェクトルートに移動: $(pwd)"

# dev ブランチ切替 & ビルド
echo "dev ブランチに切替"
git checkout dev || { echo "dev ブランチ切替失敗"; exit 1; }

echo "ビルド開始..."
npm run build || { echo "ビルド失敗"; exit 1; }

# main ブランチに切替
echo "main ブランチに切替"
git checkout main || { echo "main ブランチ切替失敗"; exit 1; }

# dev の _site を main にコピー
echo "_site を main に反映"
git checkout dev -- _site || { echo "_site 反映失敗"; exit 1; }

# コミット & push
git add _site
git commit -m "chore: update _site from dev build" || echo "コミットなし（既に最新かも）"
git push origin main || { echo "push 失敗"; exit 1; }

echo "==== dev → main 反映 完了 ===="