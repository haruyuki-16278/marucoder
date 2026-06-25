# WebARENA Indigo 運用セキュリティ強化手順 (19.9.3)

最終更新日: 2026-06-25
対象OS: Ubuntu 22.04 / 24.04
前提: 19.9.1, 19.9.2 完了済み

## 0. 目的

1. SSH 侵入試行への耐性を上げる
2. 更新運用を定期化する
3. 本番値で環境変数を固定し、誤設定リスクを下げる

## 1. fail2ban 導入と SSH 試行制限

### 1.1 fail2ban 導入

```bash
sudo apt update
sudo apt -y install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban --no-pager
```

### 1.2 sshd jail 設定

```bash
sudo tee /etc/fail2ban/jail.d/sshd.local >/dev/null <<EOF
[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
maxretry = 5
findtime = 10m
bantime = 1h
ignoreip = 127.0.0.1/8
EOF

sudo systemctl restart fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

確認ポイント:
1. sshd jail が enabled
2. maxretry/findtime/bantime が意図通り

## 2. SSH 設定再確認

```bash
sudo grep -E '^(PasswordAuthentication|PermitRootLogin|PubkeyAuthentication)' /etc/ssh/sshd_config
sudo sshd -t
sudo systemctl restart ssh
```

期待値:
1. PasswordAuthentication no
2. PermitRootLogin no
3. PubkeyAuthentication yes

## 3. 定期アップデート方針 (週次)

### 3.1 unattended-upgrades 導入

```bash
sudo apt -y install unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3.2 週次メンテナンススクリプト配置

```bash
sudo tee /usr/local/bin/marucoder-weekly-maintenance.sh >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

apt update
apt -y upgrade
apt -y autoremove
apt -y autoclean

systemctl restart marucoder || true
systemctl restart nginx || true

systemctl is-active --quiet marucoder
systemctl is-active --quiet nginx
EOF

sudo chmod 750 /usr/local/bin/marucoder-weekly-maintenance.sh
```

### 3.3 systemd timer で週次実行

```bash
sudo tee /etc/systemd/system/marucoder-maintenance.service >/dev/null <<EOF
[Unit]
Description=marucoder weekly maintenance

[Service]
Type=oneshot
ExecStart=/usr/local/bin/marucoder-weekly-maintenance.sh
EOF

sudo tee /etc/systemd/system/marucoder-maintenance.timer >/dev/null <<EOF
[Unit]
Description=Run marucoder weekly maintenance

[Timer]
OnCalendar=Sun *-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now marucoder-maintenance.timer
sudo systemctl list-timers | grep marucoder-maintenance
```

## 4. 本番環境変数固定

```bash
sudo cp /etc/marucoder.env /etc/marucoder.env.bak.$(date +%Y%m%d-%H%M%S)
sudo tee /etc/marucoder.env >/dev/null <<EOF
PORT=8000
CORS_ORIGIN=https://example.com
LOG_LEVEL=warn
EOF

sudo chmod 640 /etc/marucoder.env
sudo chown root:marucoder /etc/marucoder.env
sudo systemctl restart marucoder
sudo systemctl status marucoder --no-pager
```

確認ポイント:
1. CORS_ORIGIN が本番ドメイン
2. LOG_LEVEL が本番向け値
3. marucoder が正常起動

## 5. 最終チェック

1. [ ] fail2ban の sshd jail 稼働確認
2. [ ] SSH 強化設定確認 (password/root login 無効)
3. [ ] 週次メンテナンスタイマー有効化
4. [ ] 本番環境変数固定
5. [ ] サービス再起動後の正常稼働確認

## 6. 障害時ロールバック

### 6.1 fail2ban 誤検知時

```bash
sudo fail2ban-client set sshd unbanip <YOUR_IP>
```

### 6.2 環境変数誤設定時

```bash
sudo cp /etc/marucoder.env.bak.<timestamp> /etc/marucoder.env
sudo systemctl restart marucoder
```

### 6.3 メンテナンスタイマー停止

```bash
sudo systemctl disable --now marucoder-maintenance.timer
```
