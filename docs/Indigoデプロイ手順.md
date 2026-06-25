# WebARENA Indigo デプロイ手順 (19.9.2)

最終更新日: 2026-06-25
対象OS: Ubuntu 22.04 / 24.04
前提: 19.9.1 完了済み

## 0. 変数定義

以下の値を環境に合わせて置き換える。

- APP_USER: marucoder
- APP_DIR: /opt/marucoder
- APP_PORT: 8000
- DOMAIN: example.com
- EMAIL: admin@example.com

## 1. ランタイム導入

### 1.1 Node / npm 導入

```bash
sudo apt update
sudo apt -y install curl ca-certificates gnupg
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs
node -v
npm -v
```

### 1.2 Deno 導入

```bash
curl -fsSL https://deno.land/install.sh | sh
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
deno --version
```

## 2. アプリ配置

### 2.1 配置先作成

```bash
sudo mkdir -p /opt/marucoder
sudo chown -R marucoder:marucoder /opt/marucoder
```

### 2.2 ソース配置

```bash
sudo -u marucoder -H bash -lc '
cd /opt/marucoder
# 初回のみ
# git clone <REPOSITORY_URL> .
# 更新時
# git pull --ff-only
'
```

### 2.3 依存解決・ビルド

```bash
sudo -u marucoder -H bash -lc '
cd /opt/marucoder
deno install
# 必要なら
# deno task build
'
```

## 3. 環境変数ファイル作成

```bash
sudo tee /etc/marucoder.env >/dev/null <<EOF
PORT=8000
CORS_ORIGIN=https://example.com
LOG_LEVEL=info
EOF
sudo chmod 640 /etc/marucoder.env
sudo chown root:marucoder /etc/marucoder.env
```

## 4. systemd 常駐化

### 4.1 ユニットファイル作成

```bash
sudo tee /etc/systemd/system/marucoder.service >/dev/null <<EOF
[Unit]
Description=marucoder app server
After=network.target

[Service]
Type=simple
User=marucoder
WorkingDirectory=/opt/marucoder
EnvironmentFile=/etc/marucoder.env
ExecStart=/home/marucoder/.deno/bin/deno run -A --unstable-kv npm:vite --host 127.0.0.1 --port ${PORT}
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

### 4.2 起動・自動起動設定

```bash
sudo systemctl daemon-reload
sudo systemctl enable marucoder
sudo systemctl start marucoder
sudo systemctl status marucoder --no-pager
```

## 5. Nginx リバースプロキシ

### 5.1 Nginx 導入

```bash
sudo apt -y install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.2 サイト設定

```bash
sudo tee /etc/nginx/sites-available/marucoder.conf >/dev/null <<EOF
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/marucoder.conf /etc/nginx/sites-enabled/marucoder.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6. TLS 証明書 (Let's Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -m admin@example.com --agree-tos --redirect --non-interactive
sudo certbot renew --dry-run
```

## 7. 動作確認

```bash
curl -I http://example.com
curl -I https://example.com
curl -s 'https://example.com/api/dashboard/groups?problemId=A-01'
```

確認ポイント:
1. HTTP が HTTPS にリダイレクトされる。
2. HTTPS で 200 が返る。
3. systemd 再起動後も自動復帰する。

## 8. 再起動耐性確認

```bash
sudo reboot
# 再接続後
sudo systemctl status marucoder --no-pager
sudo systemctl status nginx --no-pager
```

## 9. よくある失敗

1. `Deno.openKv is not a function`
- 対策: `ExecStart` に `--unstable-kv` が含まれているか確認する。

2. 502 Bad Gateway
- 対策: `marucoder.service` の起動失敗を `journalctl -u marucoder -n 200` で確認する。

3. TLS 発行失敗
- 対策: DNS Aレコードが Indigo IP を向いているか確認する。
