# marucoder

Deno + Fresh ベースの授業運用アプリです。

## セットアップ

1. 環境変数を設定

```bash
cp .env.example .env
# .env の ADMIN_PASSWORD を必ず設定
```

2. 起動

```bash
deno task dev
```

ADMIN_PASSWORD が未設定の場合、起動時に明示的エラーで停止します。

## 認証仕様

- ロール: admin / teacher / student
- admin ユーザー名: admin
- admin パスワード: 環境変数 ADMIN_PASSWORD
- 教員初期パスワード: marugoto2026
- 学生初期パスワード: marugoto + 出席番号2桁

初期パスワードでログインした teacher / student は、初回ログイン時にパスワード変更が必須です。

## 一括登録 CSV 仕様

- 教員 CSV ヘッダ: lastNameRoma,firstNameRoma,email
- 学生 CSV ヘッダ: grade,attendanceNo

### ユーザー名生成

- 教員: lastNameRoma.firstNameRoma（小文字、英字とドットのみ）
- 学生: grade + attendanceNo(2桁ゼロ埋め)

例:

- grade=1 attendanceNo=3 -> username 103
- 初期パスワード -> marugoto03

## テスト

```bash
deno test -A --unstable-kv
```
