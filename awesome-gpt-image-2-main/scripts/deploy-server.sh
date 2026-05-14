#!/bin/bash
# 腾讯云轻量服务器部署脚本 - 后端服务

echo "========================================="
echo "  AI 创作平台后端部署脚本"
echo "========================================="

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo "安装 MySQL..."
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# 3. 创建数据库
echo "配置数据库..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ai_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'ai_saas'@'localhost' IDENTIFIED BY 'AiSaas2024!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ai_saas.* TO 'ai_saas'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. 创建部署目录
mkdir -p /var/www/ai-saas/server
cd /var/www/ai-saas/server

# 5. 从 GitHub 拉取代码（如果使用 git）
# git clone <your-repo> . || echo "请手动上传代码"

# 6. 安装依赖
npm install
npm install -g pm2

# 7. 配置环境变量
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
DATABASE_URL="mysql://ai_saas:AiSaas2024!@localhost:3306/ai_saas"
JWT_SECRET=your_super_strong_secret_key_at_least_32_chars_long_here_1234567890
LINGKE_API_KEY=sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD
LINGKE_BASE_URL=https://lingkeapi.com
ADMIN_KEY=admin123
EOF

# 8. 执行数据库迁移
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js

# 9. 启动后端服务
pm2 start server.js --name ai-saas-backend
pm2 save
pm2 startup

echo "========================================="
echo "  ✅ 后端服务部署完成！"
echo "  访问: http://<your-ip>:3000/api/health"
echo "========================================="
