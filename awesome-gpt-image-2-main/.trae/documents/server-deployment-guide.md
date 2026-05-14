# 云服务器后端部署指南 - ps.xiaomageai.com

## 问题分析

当前状态：
- ✅ 前端已部署在 ps.xiaomageai.com
- ❌ 后端 API 未在服务器上运行
- ❌ 登录时返回 "Unexpected token '<'" 是因为请求 `/api/auth/login` 时，服务器返回了 HTML（502 错误页面）而非 JSON

## 部署步骤

### 步骤 1：连接云服务器

```bash
ssh root@114.132.163.162
# 密码: 060947DIAo!
```

### 步骤 2：检查当前服务状态

```bash
# 检查 Nginx 是否运行
systemctl status nginx

# 检查 3000 端口是否有服务
netstat -tlnp | grep 3000

# 检查 Node.js 是否安装
node --version
```

### 步骤 3：安装依赖（如果没有）

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 MySQL
apt install -y mysql-server

# 安装 PM2（进程管理）
npm install -g pm2
```

### 步骤 4：上传代码到服务器

**方法 A：使用 SCP 上传（推荐）**

在你的本地电脑上执行：

```bash
# 创建远程目录
ssh root@114.132.163.162 "mkdir -p /var/www/ai-saas"

# 上传整个项目
scp -r "d:/my-web-app/xiaogemageai image-video/awesome-gpt-image-2-main/server" root@114.132.163.162:/var/www/ai-saas/
```

**方法 B：从 GitHub 拉取（如果已推送）**

```bash
cd /var/www/ai-saas
git clone <你的GitHub仓库地址> .
```

### 步骤 5：配置数据库

```bash
# 启动 MySQL
systemctl start mysql
systemctl enable mysql

# 创建数据库和用户
mysql -u root -e "
CREATE DATABASE IF NOT EXISTS ai_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ai_saas'@'localhost' IDENTIFIED BY 'AiSaas2024!';
GRANT ALL PRIVILEGES ON ai_saas.* TO 'ai_saas'@'localhost';
FLUSH PRIVILEGES;
"
```

### 步骤 6：安装后端依赖并配置

```bash
cd /var/www/ai-saas/server

# 安装依赖
npm install

# 创建 .env 文件
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DATABASE_URL="mysql://ai_saas:AiSaas2024!@localhost:3306/ai_saas"
JWT_SECRET=$(openssl rand -hex 32)
LINGKE_API_KEY=sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD
LINGKE_BASE_URL=https://lingkeapi.com
ADMIN_KEY=admin123
EOF

# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate deploy

# 初始化种子数据
node prisma/seed.js
```

### 步骤 7：配置 Nginx 反向代理

```bash
# 编辑 Nginx 配置
nano /etc/nginx/sites-available/ai-saas
```

**粘贴以下配置：**

```nginx
server {
    listen 80;
    server_name ps.xiaomageai.com;

    # 后端 API 代理（关键！）
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 60s;
    }

    # 前端静态文件
    location / {
        root /var/www/ai-saas/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

**启用配置并重启 Nginx：**

```bash
# 启用站点
ln -sf /etc/nginx/sites-available/ai-saas /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 步骤 8：启动后端服务

```bash
cd /var/www/ai-saas/server

# 使用 PM2 启动后端
pm2 start server.js --name ai-saas-api

# 保存 PM2 配置
pm2 save
pm2 startup

# 查看日志
pm2 logs ai-saas-api
```

### 步骤 9：验证部署

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试登录 API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ai.com","password":"admin123"}'
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "admin@ai.com", ... },
    "accessToken": "eyJhbGc..."
  }
}
```

### 步骤 10：检查防火墙

```bash
# 确保 80 端口开放
ufw allow 80/tcp

# 或者如果使用 firewalld
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
```

## 常见问题排查

### 问题 1：502 Bad Gateway

```bash
# 检查后端是否运行
pm2 status

# 检查后端日志
pm2 logs ai-saas-api

# 重启后端
pm2 restart ai-saas-api
```

### 问题 2：数据库连接失败

```bash
# 检查 MySQL 是否运行
systemctl status mysql

# 测试数据库连接
mysql -u ai_saas -p'AiSaas2024!' ai_saas -e "SELECT 1;"
```

### 问题 3：前端仍然报错

```bash
# 清除浏览器缓存
# 或使用无痕窗口访问

# 检查 Nginx 错误日志
tail -f /var/log/nginx/ai-saas-error.log
```

## 账号信息

| 角色 | 邮箱 | 密码 | 算力 |
|------|------|------|------|
| 管理员 | admin@ai.com | admin123 | 9999 |
| 测试用户 | test@ai.com | test123 | 100 |
| 演示用户 | demo@ai.com | demo123 | 50 |

## 一键部署脚本

我也提供了一个一键部署脚本：

```bash
# 在服务器上执行
curl -o deploy.sh https://raw.githubusercontent.com/你的仓库/main/scripts/deploy-server.sh
chmod +x deploy.sh
./deploy.sh
```

## 维护命令

```bash
# 查看后端状态
pm2 status

# 查看后端日志
pm2 logs ai-saas-api --lines 50

# 重启后端
pm2 restart ai-saas-api

# 停止后端
pm2 stop ai-saas-api

# 更新代码后重新部署
cd /var/www/ai-saas/server
git pull  # 或重新上传
npm install
npx prisma migrate deploy
pm2 restart ai-saas-api
```
