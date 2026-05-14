---
name: "qcloud-deploy-sop"
description: "标准化腾讯云部署操作流程，包含一键部署、域名绑定、错误处理和验证。Invoke when user wants to deploy to Tencent Cloud or setup deployment automation for ps.xiaomageai.com domain."
---

# 腾讯云标准化部署SOP

## 概述

本技能用于标准化腾讯云部署操作流程，实现一键式部署到域名 ps.xiaomageai.com。

## 服务器配置

- **服务器IP**: 114.132.163.162
- **用户名**: root
- **项目目录**: /root/xiaogemageai-image-video/awesome-gpt-image-2-main
- **域名**: ps.xiaomageai.com
- **前端静态目录**: /var/www/ps.xiaomageai.com/

## 核心部署流程

### 1. 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh - 一键部署脚本
set -e

PROJECT_DIR="/root/xiaogemageai-image-video/awesome-gpt-image-2-main"
DOMAIN_DIR="/var/www/ps.xiaomageai.com"
LOG_FILE="/var/log/deploy-$(date +%Y%m%d-%H%M%S).log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理
error_handler() {
    log "ERROR: 部署失败，错误发生在第 $1 行"
    exit 1
}
trap 'error_handler $LINENO' ERR

log "========== 开始部署 =========="

# 进入项目目录
cd "$PROJECT_DIR"
log "进入项目目录: $PROJECT_DIR"

# 拉取最新代码
log "拉取最新代码..."
git pull origin main | tee -a "$LOG_FILE"

# 安装依赖
log "安装前端依赖..."
npm install | tee -a "$LOG_FILE"

# 构建项目
log "构建前端项目..."
npm run build | tee -a "$LOG_FILE"

# 备份当前版本
BACKUP_DIR="/var/www/backups/ps.xiaomageai.com-$(date +%Y%m%d-%H%M%S)"
if [ -d "$DOMAIN_DIR" ]; then
    log "备份当前版本到 $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DOMAIN_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
fi

# 部署到域名目录
log "部署到 $DOMAIN_DIR..."
mkdir -p "$DOMAIN_DIR"
cp -r dist/* "$DOMAIN_DIR"/

# 设置权限
log "设置文件权限..."
chown -R www-data:www-data "$DOMAIN_DIR"
chmod -R 755 "$DOMAIN_DIR"

# 重启Nginx
log "重启Nginx..."
nginx -t && systemctl reload nginx

# 部署验证
log "验证部署..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://ps.xiaomageai.com)
if [ "$HTTP_CODE" = "200" ]; then
    log "✅ 部署成功！HTTP状态码: $HTTP_CODE"
    log "访问地址: http://ps.xiaomageai.com"
else
    log "❌ 部署验证失败，HTTP状态码: $HTTP_CODE"
    exit 1
fi

log "========== 部署完成 =========="
```

### 2. Nginx配置

```nginx
server {
    listen 80;
    server_name ps.xiaomageai.com;

    root /var/www/ps.xiaomageai.com;
    index index.html;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件上传大小限制
    client_max_body_size 100M;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 后端服务PM2配置

```json
{
  "apps": [{
    "name": "ai-platform-backend",
    "script": "server/server.js",
    "cwd": "/root/xiaogemageai-image-video/awesome-gpt-image-2-main",
    "instances": 1,
    "exec_mode": "fork",
    "watch": false,
    "max_memory_restart": "1G",
    "env": {
      "NODE_ENV": "production",
      "PORT": 3000
    },
    "error_file": "/var/log/ai-platform/error.log",
    "out_file": "/var/log/ai-platform/out.log",
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    "merge_logs": true
  }]
}
```

## 认证信息固化

### SSH密钥配置

1. 在开发机器上生成SSH密钥对（如果还没有）:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "deploy@xiaomageai"
   ```

2. 将公钥复制到服务器:
   ```bash
   ssh-copy-id root@114.132.163.162
   ```

3. 配置SSH config文件（~/.ssh/config）:
   ```
   Host xiaomageai-prod
       HostName 114.132.163.162
       User root
       IdentityFile ~/.ssh/id_rsa
       IdentitiesOnly yes
   ```

### 环境变量存储

创建 `.env.production` 文件并加密存储敏感信息:
```bash
# 使用sops或类似工具加密敏感信息
sops --encrypt --in-place .env.production
```

## GitHub集成部署

### 方法一：GitHub Actions自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Tencent Cloud

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        source: "dist/"
        target: "/var/www/ps.xiaomageai.com"
        strip_components: 1
    
    - name: Verify deployment
      run: |
        sleep 10
        HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" https://ps.xiaomageai.com)
        if [ "$HTTP_CODE" = "200" ]; then
          echo "✅ 部署成功"
        else
          echo "❌ 部署失败，HTTP状态码: $HTTP_CODE"
          exit 1
        fi
```

### 方法二：手动推送GitHub后服务器自动拉取

1. 在服务器上配置Webhook接收器:
   ```bash
   # 安装webhook工具
   apt-get install webhook
   
   # 配置webhook钩子
   cat > /etc/webhook/hooks.json << 'EOF'
   {
     "hooks": [{
       "id": "deploy-xiaomageai",
       "execute-command": "/root/deploy.sh",
       "command-working-directory": "/root/xiaomageai-image-video/awesome-gpt-image-2-main",
       "response-message": "部署已开始",
       "trigger-rule": {
         "match": {
           "type": "payload-hash-sha256",
           "secret": "${WEBHOOK_SECRET}",
           "parameter": {
             "source": "header",
             "name": "X-Hub-Signature-256"
           }
         }
       }
     }]
   }
   EOF
   
   # 启动webhook服务
   systemctl start webhook
   ```

## 部署验证清单

- [ ] 前端页面可访问: http://ps.xiaomageai.com
- [ ] API接口可访问: http://ps.xiaomageai.com/api/health
- [ ] Nginx运行正常: `systemctl status nginx`
- [ ] PM2进程运行: `pm2 status`
- [ ] 日志无错误: `tail -f /var/log/ai-platform/out.log`
- [ ] 域名解析正确: `nslookup ps.xiaomageai.com`
- [ ] SSL证书有效（如使用HTTPS）

## 权限控制

### 最小权限原则

1. 创建专用的部署用户:
   ```bash
   useradd -m -s /bin/bash deploy
   usermod -aG www-data deploy
   ```

2. 配置sudo权限（仅限必要命令）:
   ```bash
   # /etc/sudoers.d/deploy
   deploy ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/bin/systemctl reload nginx, /usr/bin/pm2
   ```

3. 文件权限设置:
   ```bash
   chown -R deploy:www-data /var/www/ps.xiaomageai.com
   chmod -R 755 /var/www/ps.xiaomageai.com
   ```

## 故障恢复

### 回滚脚本

```bash
#!/bin/bash
# rollback.sh - 回滚到上一个版本

BACKUP_DIR="/var/www/backups"
DOMAIN_DIR="/var/www/ps.xiaomageai.com"

# 获取最新的备份目录
LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ 没有找到备份文件"
    exit 1
fi

echo "回滚到版本: $LATEST_BACKUP"

# 删除当前版本
rm -rf "$DOMAIN_DIR"/*

# 恢复备份
cp -r "$BACKUP_DIR/$LATEST_BACKUP"/* "$DOMAIN_DIR"/

# 重启Nginx
nginx -t && systemctl reload nginx

echo "✅ 回滚完成"
```

## 监控与告警

### 健康检查脚本

```bash
#!/bin/bash
# health-check.sh

URL="http://ps.xiaomageai.com"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] 服务异常，HTTP状态码: $HTTP_CODE" >> /var/log/health-check.log
    
    # 发送告警（可配置邮件、微信、钉钉等）
    # curl -X POST "https://your-webhook-url" -d "服务异常: $HTTP_CODE"
    
    # 尝试自动重启
    pm2 restart ai-platform-backend
    systemctl reload nginx
fi
```

### Crontab配置

```bash
# 每5分钟检查一次服务状态
*/5 * * * * /root/health-check.sh

# 每天凌晨2点自动拉取部署
0 2 * * * cd /root/xiaomageai-image-video/awesome-gpt-image-2-main && git pull && npm run build && cp -r dist/* /var/www/ps.xiaomageai.com/
```