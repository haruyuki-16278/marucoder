# WebARENA Indigo 初期セットアップ手順 (19.9.1)

最終更新日: 2026-06-25
対象OS: Ubuntu 22.04 / 24.04
対象環境: WebARENA Indigo VPS

## 0. 前提

1. root でSSH接続できること
2. ローカルPCに公開鍵があること (例: ~/.ssh/id_ed25519.pub)
3. 初期グローバルIPが割り当て済みであること

## 1. システム更新と時刻設定

```bash
sudo apt update
sudo apt -y upgrade
sudo timedatectl set-timezone Asia/Tokyo
sudo timedatectl set-ntp true
sudo timedatectl status
```

確認ポイント:
1. Time zone が `Asia/Tokyo`
2. System clock synchronized が `yes`

## 2. 運用ユーザー作成とsudo付与

ユーザー名は例として `marucoder` を使用。

```bash
sudo adduser marucoder
sudo usermod -aG sudo marucoder
id marucoder
```

確認ポイント:
1. `groups` に `sudo` が含まれる

## 3. SSH鍵認証設定

### 3.1 ローカル公開鍵をサーバへ登録

ローカルPCで実行:

```bash
ssh-copy-id marucoder@<INDIGO_SERVER_IP>
```

`ssh-copy-id` が使えない場合:

```bash
cat ~/.ssh/id_ed25519.pub
```

表示された1行をサーバ側で登録:

```bash
sudo -u marucoder mkdir -p /home/marucoder/.ssh
sudo -u marucoder chmod 700 /home/marucoder/.ssh
sudo -u marucoder tee -a /home/marucoder/.ssh/authorized_keys >/dev/null
sudo -u marucoder chmod 600 /home/marucoder/.ssh/authorized_keys
```

### 3.2 SSHデーモンを鍵認証・公開鍵のみへ変更

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d-%H%M%S)
sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl restart ssh
sudo systemctl status ssh --no-pager
```

確認ポイント:
1. 新しいターミナルから `ssh marucoder@<INDIGO_SERVER_IP>` が成功
2. `root` ログイン不可

## 4. ファイアウォール設定 (UFW)

```bash
sudo apt -y install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

確認ポイント:
1. 許可ポートが `22, 80, 443` のみ
2. それ以外は deny

## 5. 追加の初期ハードニング (推奨)

```bash
sudo apt -y install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

## 6. 完了チェック

1. [x] OS更新完了
2. [x] タイムゾーン/時刻同期完了
3. [x] 運用ユーザー作成・sudo付与完了
4. [x] SSH鍵認証のみで接続可能
5. [x] root/パスワードログイン無効化
6. [x] UFWで22/80/443以外が閉鎖

## 7. ロールバック手順 (緊急時)

SSH設定変更で接続不能になった場合、VPSコンソールから root でログインして復旧:

```bash
sudo cp /etc/ssh/sshd_config.bak.<timestamp> /etc/ssh/sshd_config
sudo systemctl restart ssh
```
## 8. 次ステップ

次は 19.9.2 (Indigo デプロイ手順確立) を実施する。

## 9. 管理者認証の初期設定 (必須)

アプリ起動前に `ADMIN_PASSWORD` を必ず設定する。

```bash
sudo -u marucoder tee /opt/marucoder/.env >/dev/null << 'EOF'
ADMIN_PASSWORD=<十分に強い管理者パスワード>
EOF
sudo chmod 600 /opt/marucoder/.env
```

確認ポイント:
1. `ADMIN_PASSWORD` が未設定だとアプリは起動時にエラー停止する
2. `.env` の権限は `600` であること
