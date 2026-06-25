# WebARENA Indigo 監視・バックアップ運用手順 (19.9.4)

最終更新日: 2026-06-25
対象OS: Ubuntu 22.04 / 24.04
前提: 19.9.1, 19.9.2, 19.9.3 完了済み

## 0. 目的

1. サービス異常を早期検知する。
2. Deno KV データを定期バックアップする。
3. 復元手順を定期リハーサルし、復旧可能性を担保する。

## 1. 監視対象と確認コマンド

監視対象:
1. marucoder.service
2. nginx.service
3. fail2ban.service
4. ディスク使用率
5. HTTPS疎通

確認コマンド:

sudo systemctl status marucoder --no-pager
sudo systemctl status nginx --no-pager
sudo systemctl status fail2ban --no-pager
sudo journalctl -u marucoder -n 200 --no-pager
sudo journalctl -u nginx -n 200 --no-pager
df -h
curl -I https://example.com

## 2. ログローテーション設定

### 2.1 journald の保存上限

sudo mkdir -p /etc/systemd/journald.conf.d
sudo tee /etc/systemd/journald.conf.d/size-limit.conf >/dev/null <<EOF
[Journal]
SystemMaxUse=500M
SystemMaxFileSize=100M
MaxRetentionSec=14day
EOF
sudo systemctl restart systemd-journald

### 2.2 Nginx ログローテーション確認

sudo cat /etc/logrotate.d/nginx

必要なら保持期間を調整する。

## 3. Deno KV バックアップ

### 3.1 バックアップ格納先作成

sudo mkdir -p /var/backups/marucoder
sudo chown root:marucoder /var/backups/marucoder
sudo chmod 750 /var/backups/marucoder

### 3.2 バックアップスクリプト作成

sudo tee /usr/local/bin/marucoder-kv-backup.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

TS=$(date +%Y%m%d-%H%M%S)
BASE=/var/backups/marucoder
TARGET_DIR="$BASE/$TS"
APP_DIR=/opt/marucoder

mkdir -p "$TARGET_DIR"

if [ -f "$APP_DIR/kv.sqlite3" ]; then
  cp "$APP_DIR/kv.sqlite3" "$TARGET_DIR/kv.sqlite3"
fi

if [ -f "$APP_DIR/kv.sqlite3-wal" ]; then
  cp "$APP_DIR/kv.sqlite3-wal" "$TARGET_DIR/kv.sqlite3-wal"
fi

if [ -f "$APP_DIR/kv.sqlite3-shm" ]; then
  cp "$APP_DIR/kv.sqlite3-shm" "$TARGET_DIR/kv.sqlite3-shm"
fi

tar -czf "$BASE/kv-backup-$TS.tar.gz" -C "$TARGET_DIR" .
rm -rf "$TARGET_DIR"

# 30日より古いバックアップを削除
find "$BASE" -type f -name 'kv-backup-*.tar.gz' -mtime +30 -delete
EOF

sudo chmod 750 /usr/local/bin/marucoder-kv-backup.sh

### 3.3 手動実行確認

sudo /usr/local/bin/marucoder-kv-backup.sh
ls -lh /var/backups/marucoder

### 3.4 定期実行タイマー設定

sudo tee /etc/systemd/system/marucoder-kv-backup.service >/dev/null <<EOF
[Unit]
Description=marucoder Deno KV backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/marucoder-kv-backup.sh
EOF

sudo tee /etc/systemd/system/marucoder-kv-backup.timer >/dev/null <<EOF
[Unit]
Description=Run marucoder KV backup daily

[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now marucoder-kv-backup.timer
sudo systemctl list-timers | grep marucoder-kv-backup

## 4. 復元リハーサル手順

注意:
1. 授業時間外に実施する。
2. 実施前に最新バックアップを取得する。

### 4.1 復元テスト用バックアップ展開

sudo mkdir -p /tmp/marucoder-restore
sudo tar -xzf /var/backups/marucoder/kv-backup-<TIMESTAMP>.tar.gz -C /tmp/marucoder-restore
ls -lh /tmp/marucoder-restore

### 4.2 サービス停止と復元

sudo systemctl stop marucoder
sudo cp /opt/marucoder/kv.sqlite3 /opt/marucoder/kv.sqlite3.bak.$(date +%Y%m%d-%H%M%S) || true
sudo cp /tmp/marucoder-restore/kv.sqlite3 /opt/marucoder/kv.sqlite3
sudo cp /tmp/marucoder-restore/kv.sqlite3-wal /opt/marucoder/kv.sqlite3-wal || true
sudo cp /tmp/marucoder-restore/kv.sqlite3-shm /opt/marucoder/kv.sqlite3-shm || true
sudo chown marucoder:marucoder /opt/marucoder/kv.sqlite3*
sudo systemctl start marucoder
sudo systemctl status marucoder --no-pager

### 4.3 動作確認

curl -s 'https://example.com/api/dashboard/groups?problemId=A-01'

### 4.4 後片付け

sudo rm -rf /tmp/marucoder-restore

## 5. 週次運用チェックリスト

1. [ ] marucoder/nginx/fail2ban 稼働確認
2. [ ] ディスク使用率 80% 未満
3. [ ] 最新バックアップ生成確認
4. [ ] バックアップ保持本数確認
5. [ ] 直近エラー件数確認

## 6. 障害時の初動

1. サービス状態確認。
2. 直近ログ確認。
3. 必要時に直近バックアップから復元。
4. 復旧不可の場合は障害報告テンプレートでエスカレーション。
