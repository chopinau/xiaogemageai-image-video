import paramiko
import tempfile
import os

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

def main():
    print("==========================================")
    print("  配置腾讯云部署环境")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 1. 创建项目目录结构
        print("[1/6] 创建项目目录结构...")
        commands = [
            "mkdir -p /root/xiaogemageai-image-video",
            "mkdir -p /var/www/ps.xiaomageai.com",
            "mkdir -p /var/www/backups",
            "mkdir -p /var/log/ai-platform",
            "mkdir -p /var/log/deploy",
            "chmod -R 755 /var/www",
        ]
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        print("✅ 目录结构创建完成")
        
        # 2. 创建一键部署脚本
        print()
        print("[2/6] 创建一键部署脚本...")
        deploy_script = '''#!/bin/bash
# deploy.sh - 一键部署到 ps.xiaomageai.com
set -e

PROJECT_DIR="/root/xiaogemageai-image-video/awesome-gpt-image-2-main"
DOMAIN_DIR="/var/www/ps.xiaomageai.com"
LOG_FILE="/var/log/deploy/deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="/var/www/backups/ps.xiaomageai.com-$(date +%Y%m%d-%H%M%S)"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理
error_handler() {
    log "ERROR: 部署失败，错误发生在第 $1 行"
    log "请检查日志: $LOG_FILE"
    exit 1
}
trap 'error_handler $LINENO' ERR

log "========== 开始部署 =========="
log "项目目录: $PROJECT_DIR"
log "目标目录: $DOMAIN_DIR"

# 进入项目目录
cd "$PROJECT_DIR"
log "✅ 进入项目目录"

# 拉取最新代码（如果使用git）
if [ -d ".git" ]; then
    log "拉取最新代码..."
    git pull origin main 2>&1 | tee -a "$LOG_FILE" || log "⚠️  Git pull 失败，继续构建当前代码"
else
    log "⚠️  非Git仓库，跳过pull"
fi

# 安装依赖
log "安装依赖..."
npm install 2>&1 | tee -a "$LOG_FILE"

# 构建项目
log "构建前端项目..."
npm run build 2>&1 | tee -a "$LOG_FILE"

# 备份当前版本
if [ -d "$DOMAIN_DIR" ] && [ "$(ls -A $DOMAIN_DIR 2>/dev/null)" ]; then
    log "备份当前版本到 $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$DOMAIN_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
fi

# 部署到域名目录
log "部署文件到 $DOMAIN_DIR..."
mkdir -p "$DOMAIN_DIR"
rm -rf "$DOMAIN_DIR"/*
cp -r dist/* "$DOMAIN_DIR"/ 2>/dev/null || {
    log "ERROR: 复制dist文件失败"
    exit 1
}

# 设置权限
log "设置文件权限..."
chown -R www-data:www-data "$DOMAIN_DIR" 2>/dev/null || true
chmod -R 755 "$DOMAIN_DIR"

# 更新供应商配置
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

# 重启后端服务
log "重启后端服务..."
cd "$PROJECT_DIR/server"
pm2 restart ai-platform-backend 2>/dev/null || {
    log "PM2服务不存在，尝试启动..."
    pm2 start server.js --name ai-platform-backend
}
pm2 save

# 重启Nginx
log "重启Nginx..."
nginx -t 2>&1 | tee -a "$LOG_FILE" && systemctl reload nginx

# 部署验证
log ""
log "验证部署..."
sleep 2

# 检查前端
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://ps.xiaomageai.com)
if [ "$HTTP_CODE" = "200" ]; then
    log "✅ 前端部署成功！HTTP状态码: $HTTP_CODE"
    log "   访问地址: http://ps.xiaomageai.com"
else
    log "❌ 前端部署验证失败，HTTP状态码: $HTTP_CODE"
fi

# 检查后端API
API_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://ps.xiaomageai.com/api/health)
if [ "$API_CODE" = "200" ]; then
    log "✅ 后端API部署成功！HTTP状态码: $API_CODE"
    log "   API地址: http://ps.xiaomageai.com/api/health"
else
    log "❌ 后端API部署验证失败，HTTP状态码: $API_CODE"
fi

# 检查供应商
SUPPLIERS=$(curl -s http://ps.xiaomageai.com/api/pricing-admin/upstream/providers -H "Authorization: Bearer $(curl -s -X POST http://ps.xiaomageai.com/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@ai.com","password":"admin123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)" 2>/dev/null | grep -o '"name"' | wc -l)
log "📦 供应商数量: $SUPPLIERS"

log ""
log "========== 部署完成 =========="
log "日志文件: $LOG_FILE"
'''
        
        # 写入部署脚本
        sftp = ssh.open_sftp()
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False, encoding='utf-8') as f:
            f.write(deploy_script)
            sftp.put(f.name, '/root/deploy.sh')
        sftp.close()
        
        stdin, stdout, stderr = ssh.exec_command("chmod +x /root/deploy.sh")
        stdout.channel.recv_exit_status()
        print("✅ 部署脚本创建完成: /root/deploy.sh")
        
        # 3. 配置Nginx
        print()
        print("[3/6] 配置Nginx...")
        nginx_config = '''server {
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
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.conf', delete=False, encoding='utf-8') as f:
            f.write(nginx_config)
            sftp = ssh.open_sftp()
            sftp.put(f.name, '/etc/nginx/sites-available/ps.xiaomageai.com')
            sftp.close()
        
        commands = [
            "ln -sf /etc/nginx/sites-available/ps.xiaomageai.com /etc/nginx/sites-enabled/",
            "rm -f /etc/nginx/sites-enabled/default",
            "nginx -t",
            "systemctl reload nginx",
        ]
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            exit_code = stdout.channel.recv_exit_status()
            if exit_code != 0 and "nginx -t" in cmd:
                error = stderr.read().decode('utf-8')
                print(f"⚠️  Nginx配置测试失败: {error}")
        
        print("✅ Nginx配置完成")
        
        # 4. 配置PM2
        print()
        print("[4/6] 配置PM2...")
        pm2_config = {
            "apps": [{
                "name": "ai-platform-backend",
                "script": "server/server.js",
                "cwd": "/root/xiaogemageai-image-video/awesome-gpt-image-2-main",
                "instances": 1,
                "exec_mode": "fork",
                "watch": False,
                "max_memory_restart": "1G",
                "env": {
                    "NODE_ENV": "production",
                    "PORT": 3000
                },
                "error_file": "/var/log/ai-platform/error.log",
                "out_file": "/var/log/ai-platform/out.log",
                "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
                "merge_logs": True
            }]
        }
        
        import json
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            json.dump(pm2_config, f, indent=2)
            sftp = ssh.open_sftp()
            sftp.put(f.name, '/root/xiaogemageai-image-video/awesome-gpt-image-2-main/ecosystem.config.json')
            sftp.close()
        
        print("✅ PM2配置完成")
        
        # 5. 配置健康检查
        print()
        print("[5/6] 配置健康检查...")
        health_check = '''#!/bin/bash
# health-check.sh - 服务健康检查

URL="http://ps.xiaomageai.com"
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] 服务异常，HTTP状态码: $HTTP_CODE" >> /var/log/health-check.log
    
    # 尝试自动重启
    cd /root/xiaogemageai-image-video/awesome-gpt-image-2-main/server
    pm2 restart ai-platform-backend 2>/dev/null
    systemctl reload nginx 2>/dev/null
    
    echo "[$(date)] 已尝试重启服务" >> /var/log/health-check.log
fi
'''
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sh', delete=False, encoding='utf-8') as f:
            f.write(health_check)
            sftp = ssh.open_sftp()
            sftp.put(f.name, '/root/health-check.sh')
            sftp.close()
        
        stdin, stdout, stderr = ssh.exec_command("chmod +x /root/health-check.sh")
        stdout.channel.recv_exit_status()
        
        # 添加crontab
        stdin, stdout, stderr = ssh.exec_command("(crontab -l 2>/dev/null; echo '*/5 * * * * /root/health-check.sh') | crontab -")
        stdout.channel.recv_exit_status()
        print("✅ 健康检查配置完成")
        
        # 6. 初始化Git仓库（如果不存在）
        print()
        print("[6/6] 初始化Git仓库...")
        commands = [
            "cd /root/xiaogemageai-image-video/awesome-gpt-image-2-main || mkdir -p /root/xiaogemageai-image-video/awesome-gpt-image-2-main",
            "cd /root/xiaogemageai-image-video/awesome-gpt-image-2-main && git init 2>/dev/null || true",
            "cd /root/xiaogemageai-image-video/awesome-gpt-image-2-main && git remote add origin https://github.com/YOUR_USERNAME/xiaogemageai-image-video.git 2>/dev/null || true",
        ]
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        print("✅ Git仓库配置完成")
        
        ssh.close()
        
        print()
        print("==========================================")
        print("  部署环境配置完成!")
        print("==========================================")
        print()
        print("📋 下一步操作:")
        print("1. 上传代码到服务器:")
        print("   - 方法A: 手动上传或Git clone")
        print("   - 方法B: 配置GitHub后自动部署")
        print()
        print("2. 执行部署:")
        print("   bash /root/deploy.sh")
        print()
        print("3. 访问网站:")
        print("   http://ps.xiaomageai.com")
        print()
        print("🔧 常用命令:")
        print("   - 查看部署日志: tail -f /var/log/deploy/*.log")
        print("   - 查看后端日志: pm2 logs ai-platform-backend")
        print("   - 重启服务: pm2 restart ai-platform-backend")
        print("   - 回滚版本: ls /var/www/backups/")
        
    except Exception as e:
        print(f"配置过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
