import paramiko
import tempfile
import os

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

# 部署脚本内容
DEPLOY_SCRIPT = r'''#!/bin/bash
# deploy.sh - 一键部署到 ps.xiaomageai.com
set -e

PROJECT_DIR="/root/xiaogemageai-image-video/awesome-gpt-image-2-main"
DOMAIN_DIR="/var/www/ps.xiaomageai.com"
LOG_FILE="/var/log/deploy/deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/var/www/backups/ps.xiaomageai.com-$(date +%Y%m%d-%H%M%S)"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_handler() {
    log "ERROR: 部署失败，错误发生在第 $1 行"
    log "请检查日志: $LOG_FILE"
    exit 1
}
trap 'error_handler $LINENO' ERR

log "========== 开始部署 =========="

cd "$PROJECT_DIR"
log "进入项目目录: $PROJECT_DIR"

if [ -d ".git" ]; then
    log "拉取最新代码..."
    git pull origin main 2>&1 | tee -a "$LOG_FILE" || log "Git pull 失败，继续构建当前代码"
else
    log "非Git仓库，跳过pull"
fi

log "安装依赖..."
npm install 2>&1 | tee -a "$LOG_FILE"

log "构建前端项目..."
npm run build 2>&1 | tee -a "$LOG_FILE"

if [ -d "$DOMAIN_DIR" ] && [ "$(ls -A $DOMAIN_DIR 2>/dev/null)" ]; then
    log "备份当前版本到 $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DOMAIN_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
fi

log "部署文件到 $DOMAIN_DIR..."
mkdir -p "$DOMAIN_DIR"
rm -rf "$DOMAIN_DIR"/*
cp -r dist/* "$DOMAIN_DIR"/ 2>/dev/null || {
    log "ERROR: 复制dist文件失败"
    exit 1
}

log "设置文件权限..."
chown -R www-data:www-data "$DOMAIN_DIR" 2>/dev/null || true
chmod -R 755 "$DOMAIN_DIR"

log "更新供应商配置..."
cat > "$PROJECT_DIR/server/data/upstreamProviders.json" << 'PROVIDERS'
{
  "providers": [
    {
      "name": "Lingke",
      "url": "https://lingkeapi.com",
      "apiKey": "sk-I8KygCSUZtzdNFCxdieZo4iYHoGssrynSNF4cAaw52AHh3ax",
      "addedAt": "2026-05-13T17:00:00.000Z"
    },
    {
      "name": "Apitik",
      "url": "https://value.apiqik.online",
      "apiKey": "sk-D5jZu1bvhoV3clMIsx5srpPH8xuyvEddGTGeeLdnaNXEL1TY",
      "addedAt": "2026-05-13T17:00:00.000Z"
    },
    {
      "name": "小马AI",
      "url": "https://api.ai6800.com",
      "apiKey": "sk-3cd90503fab03def78138b6d3fbb95cff391e6938af72f8e",
      "addedAt": "2026-05-13T17:00:00.000Z"
    }
  ]
}
PROVIDERS

log "重启后端服务..."
cd "$PROJECT_DIR/server"
pm2 restart ai-platform-backend 2>/dev/null || {
    pm2 start server.js --name ai-platform-backend
}
pm2 save

log "重启Nginx..."
nginx -t 2>&1 | tee -a "$LOG_FILE" && systemctl reload nginx

log "验证部署..."
sleep 2

HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://ps.xiaomageai.com)
if [ "$HTTP_CODE" = "200" ]; then
    log "前端部署成功！HTTP状态码: $HTTP_CODE"
    log "访问地址: http://ps.xiaomageai.com"
else
    log "前端部署验证失败，HTTP状态码: $HTTP_CODE"
fi

API_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://ps.xiaomageai.com/api/health)
if [ "$API_CODE" = "200" ]; then
    log "后端API部署成功！HTTP状态码: $API_CODE"
else
    log "后端API部署验证失败，HTTP状态码: $API_CODE"
fi

log "========== 部署完成 =========="
log "日志文件: $LOG_FILE"
'''

# Nginx配置
NGINX_CONFIG = '''server {
    listen 80;
    server_name ps.xiaomageai.com;

    root /var/www/ps.xiaomageai.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

    client_max_body_size 100M;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
'''

def main():
    print("==========================================")
    print("  修复服务器配置文件")
    print("==========================================")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 写入部署脚本
        print("上传部署脚本...")
        sftp = ssh.open_sftp()
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False, encoding='utf-8') as f:
            f.write(DEPLOY_SCRIPT)
            temp_path = f.name
        sftp.put(temp_path, '/root/deploy.sh')
        os.unlink(temp_path)
        ssh.exec_command("chmod +x /root/deploy.sh")[1].channel.recv_exit_status()
        print("部署脚本已上传: /root/deploy.sh")
        
        # 写入Nginx配置
        print("上传Nginx配置...")
        with tempfile.NamedTemporaryFile(mode='w', suffix='.conf', delete=False, encoding='utf-8') as f:
            f.write(NGINX_CONFIG)
            temp_path = f.name
        sftp.put(temp_path, '/etc/nginx/sites-available/ps.xiaomageai.com')
        os.unlink(temp_path)
        sftp.close()
        
        # 重新启用Nginx配置
        stdin, stdout, stderr = ssh.exec_command("""
            ln -sf /etc/nginx/sites-available/ps.xiaomageai.com /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            nginx -t
            systemctl reload nginx
        """)
        stdout.channel.recv_exit_status()
        print("Nginx配置已更新")
        
        # 验证文件内容
        print("\n验证文件内容...")
        stdin, stdout, stderr = ssh.exec_command("wc -l /root/deploy.sh /etc/nginx/sites-available/ps.xiaomageai.com")
        output = stdout.read().decode('utf-8')
        print(output)
        
        ssh.close()
        print("\n配置修复完成!")
        
    except Exception as e:
        print(f"修复过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
