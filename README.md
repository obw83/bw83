# for_Mr-Ohmori


### 毎回の作業前セッティング

# プロジェクトフォルダに移動
cd /Users/lapis/git/neon/for_Mr-Ohmori

# .nvmrc に書かれたバージョンに切り替え
nvm use

# 依存パッケージを確認・インストール（初回または追加後）
npm install

# 開発サーバー起動（変更が即反映される）
npm run dev

# これでブラウザで http://localhost:8080 を開きながらページ作りが可能


### dev環境で確認


# 開発用からビルド
npm run build
 - docs/ フォルダに GitHub Pages 用のファイルが生成される

# 確認したい場合はローカルサーバーでも確認可能：
# serve コマンドで docs/ をブラウザで確認
npx serve docs
# または npm run dev のままでも OK（ソースファイル編集中はこっち）


### 本番環境（GitHub Pages）への公開方法

# 変更を Git にコミット
git add -A
git commit -m "build: update pages"

# GitHub に push
git push origin main


# GitHub → Settings → Pages → Branch: main / Folder: /docs を選択


### 開発作業 → dev ブランチで進める

git checkout dev
# 変更
git add -A
git commit -m "feat: add workshop page"
git push

### 本番公開するときだけ → main にマージ
git checkout main
git pull
git merge dev
git push

## 	GitHub Pages は main/docs/ を参照しているので、本番反映したいときは必ず main で npm run build して push 👍