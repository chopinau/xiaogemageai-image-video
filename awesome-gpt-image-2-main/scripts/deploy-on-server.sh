#!/bin/bash
set -e

echo "=== AI SaaS 后端部署脚本 ==="

mkdir -p /var/www/ai-saas/server /var/www/ai-saas/dist

cd /var/www/ai-saas/server

if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

npm install --production 2>&1 | tail -5

npm install -g pm2 2>&1 | tail -3

cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=xiaomageai_production_secret_key_2024_do_not_share_abcdef123456
LINGKE_API_KEY=sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD
LINGKE_BASE_URL=https://lingkeapi.com
ADMIN_KEY=admin123
MAIN_DOMAIN=ps.xiaomageai.com
ENVEOF

echo "生成 Prisma 客户端..."
npx prisma generate 2>&1 | tail -3

echo "初始化数据库..."
npx prisma db push --accept-data-loss 2>&1 | tail -3

echo "初始化种子数据..."
node prisma/seed.js 2>&1 || echo "种子数据已存在，跳过"

echo "停止旧服务..."
pm2 stop ai-saas-api 2>/dev/null || true
pm2 delete ai-saas-api 2>/dev/null || true

echo "启动后端服务..."
pm2 start server.js --name ai-saas-api 2>&1 | tail -5
pm2 save 2>&1 | tail -3

echo "配置 PM2 开机自启..."
pm2 startup systemd -u root --hp /root 2>&1 | tail -3 || true

sleep 3

echo "验证服务..."
curl -s http://localhost:3000/api/health | head -100 || echo "服务启动中..."

echo ""
echo "=== 部署完成 ==="
echo "后端 API: http://localhost:3000"
echo "健康检查: curl http://localhost:3000/api/health"
echo "查看日志: pm2 logs ai-saas-api"
