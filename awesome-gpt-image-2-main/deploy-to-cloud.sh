#!/bin/bash
# 部署脚本 - 将更新推送到腾讯云服务器

set -e

SERVER_IP="114.132.163.162"
SERVER_USER="root"
SERVER_PASS="060947DIAo"
PROJECT_DIR="d:/my-web-app/xiaogemageai image-video/awesome-gpt-image-2-main"

echo "=========================================="
echo "  部署更新到腾讯云服务器"
echo "=========================================="
echo "服务器: $SERVER_USER@$SERVER_IP"
echo ""

# 创建密码文件用于SSH免交互
echo "$SERVER_PASS" > /tmp/ssh_pass.txt
chmod 600 /tmp/ssh_pass.txt

# 上传前端dist目录
echo "[1/3] 上传前端文件..."
cd "$PROJECT_DIR"
sshpass -f /tmp/ssh_pass.txt scp -r dist "$SERVER_USER@$SERVER_IP:/opt/ai-platform/"
echo "前端文件上传完成!"

# 上传后端server目录
echo ""
echo "[2/3] 上传后端代码..."
sshpass -f /tmp/ssh_pass.txt scp -r server "$SERVER_USER@$SERVER_IP:/opt/ai-platform/"
echo "后端代码上传完成!"

# 在服务器上执行部署命令
echo ""
echo "[3/3] 在服务器上执行部署..."
sshpass -f /tmp/ssh_pass.txt ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
    cd /opt/ai-platform/server
    
    # 停止现有服务
    pm2 stop ai-platform-backend 2>/dev/null || true
    
    # 安装依赖（如果需要）
    npm install --production
    
    # 更新供应商配置文件
    cat > /opt/ai-platform/server/data/upstreamProviders.json << 'PROVIDERS_EOF'
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
PROVIDERS_EOF

    # 启动服务
    pm2 start server.js --name ai-platform-backend
    pm2 save
    
    echo "部署完成!"
EOF

echo ""
echo "=========================================="
echo "  部署成功!"
echo "=========================================="
echo ""
echo "访问地址: http://$SERVER_IP"
echo "API地址: http://$SERVER_IP/api"

# 清理临时文件
rm -f /tmp/ssh_pass.txt
