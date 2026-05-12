# 腾讯云服务器部署指南

## 快速部署步骤

### 第一步: SSH 连接到服务器

在本地 PowerShell 或 CMD 中执行:
```bash
ssh root@114.132.163.162
# 输入密码: 060947DIAo!
```

### 第二步: 在服务器上运行环境配置脚本

连接成功后，在服务器终端执行:

```bash
# 下载并运行部署脚本
cat > /tmp/deploy-server.sh << 'EOF'
#!/bin/bash
set -e
echo "=========================================="
echo "  AI 后端服务一键部署脚本"
echo "=========================================="

apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git vim unzip nginx

# 安装 Node.js 20.x
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 安装 MySQL
export DEBIAN_FRONTEND=noninteractive
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql
mysql -u root <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '060947DIAo!';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

# 安装 PM2
npm install -g pm2

# 创建项目目录
mkdir -p /opt/ai-platform
mkdir -p /var/log/ai-platform

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=========================================="
echo "  基础环境配置完成!"
echo "=========================================="
EOF

chmod +x /tmp/deploy-server.sh
/tmp/deploy-server.sh
```

### 第三步: 上传后端代码

在本地另一个终端中执行 (在项目目录下):
```bash
cd "d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main"
scp -r server/ root@114.132.163.162:/opt/ai-platform/
```

### 第四步: 配置并启动服务

回到服务器 SSH 终端:

```bash
cd /opt/ai-platform/server

# 创建环境变量文件
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DATABASE_URL="mysql://root:060947DIAo!@localhost:3306/ai_platform"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-123456789"
LINGKE_API_KEY="sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD"
LINGKE_API_BASE_URL="https://lingkeapi.com"
WECHAT_APP_ID=""
WECHAT_MCH_ID=""
WECHAT_PAY_KEY=""
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
EOF

# 安装依赖
npm install

# 数据库迁移
npx prisma migrate deploy

# 生成种子数据
node prisma/seed.js

# 配置 Nginx
cat > /etc/nginx/sites-available/ai-platform << 'EOF'
server {
    listen 80;
    server_name _;
    
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
}
EOF

ln -sf /etc/nginx/sites-available/ai-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# 使用 PM2 启动服务
pm2 start server.js --name ai-platform-backend
pm2 save
pm2 startup

echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo "访问地址: http://114.132.163.162"
echo "API 地址: http://114.132.163.162/api"
echo "PM2 状态: pm2 status"
echo "查看日志: pm2 logs ai-platform-backend"
```

## 验证部署

```bash
# 检查 PM2 状态
pm2 status

# 查看服务日志
pm2 logs ai-platform-backend

# 测试 API
curl http://localhost:3000/api/health

# 检查 Nginx
systemctl status nginx
```

## 预设账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin@ai.com | admin123 | 管理员 |
| test@ai.com | test123 | 普通用户 |

## 故障排查

### 查看服务日志
```bash
pm2 logs ai-platform-backend --lines 100
```

### 重启服务
```bash
pm2 restart ai-platform-backend
```

### 查看 Nginx 日志
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```
