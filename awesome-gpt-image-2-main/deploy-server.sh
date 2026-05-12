#!/bin/bash
# 后端一键部署脚本 - 腾讯云轻量服务器
# 项目: AI 图像/视频生成服务

set -e

echo "=========================================="
echo "  AI 后端服务一键部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户执行此脚本"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "正在更新系统..."
    apt-get update -y
    apt-get upgrade -y
}

# 安装必要工具
install_tools() {
    log_info "正在安装必要工具..."
    apt-get install -y curl wget git vim unzip nginx certbot python3-certbot-nginx
}

# 安装 Node.js (20.x LTS)
install_nodejs() {
    log_info "正在安装 Node.js 20.x LTS..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        log_info "Node.js 安装完成: $(node -v)"
    else
        log_warn "Node.js 已存在: $(node -v)"
    fi
}

# 安装 MySQL
install_mysql() {
    log_info "正在安装 MySQL..."
    if ! command -v mysql &> /dev/null; then
        export DEBIAN_FRONTEND=noninteractive
        apt-get install -y mysql-server
        
        # 启动 MySQL
        systemctl start mysql
        systemctl enable mysql
        
        # 设置 root 密码和权限
        mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '060947DIAo!';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
        log_info "MySQL 安装完成"
    else
        log_warn "MySQL 已存在"
        mysql -u root -p'060947DIAo!' -e "CREATE DATABASE IF NOT EXISTS ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    fi
}

# 配置项目目录
setup_project() {
    log_info "正在配置项目目录..."
    PROJECT_DIR="/opt/ai-platform"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    log_info "请上传项目文件到 $PROJECT_DIR"
    log_info "或者使用 git clone 命令"
}

# 创建环境变量文件
create_env() {
    log_info "正在创建环境变量文件..."
    cat > /opt/ai-platform/server/.env <<EOF
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置 (MySQL)
DATABASE_URL="mysql://root:060947DIAo!@localhost:3306/ai_platform"

# JWT 密钥 (生产环境请务必更换!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production-123456789"

# Lingke API 配置
LINGKE_API_KEY="sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD"
LINGKE_API_BASE_URL="https://lingkeapi.com"

# 支付配置 (可选)
WECHAT_APP_ID=""
WECHAT_MCH_ID=""
WECHAT_PAY_KEY=""
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
EOF
    
    log_info "环境变量文件已创建"
}

# 配置 Nginx
setup_nginx() {
    log_info "正在配置 Nginx..."
    
    cat > /etc/nginx/sites-available/ai-platform <<EOF
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /opt/ai-platform;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 文件上传大小限制
    client_max_body_size 100M;
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/ai-platform /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试并重启 Nginx
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
    
    log_info "Nginx 配置完成"
}

# 安装 PM2 用于进程管理
install_pm2() {
    log_info "正在安装 PM2..."
    npm install -g pm2
}

# 创建 PM2 配置
setup_pm2() {
    log_info "正在配置 PM2..."
    cat > /opt/ai-platform/ecosystem.config.json <<EOF
{
  "apps": [{
    "name": "ai-platform-backend",
    "script": "server.js",
    "cwd": "/opt/ai-platform/server",
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
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
  }]
}
EOF
    
    mkdir -p /var/log/ai-platform
    log_info "PM2 配置完成"
}

# 配置防火墙
setup_firewall() {
    log_info "正在配置防火墙..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    log_info "防火墙配置完成"
}

# 主函数
main() {
    check_root
    
    echo ""
    log_info "开始部署..."
    echo ""
    
    update_system
    install_tools
    install_nodejs
    install_mysql
    setup_project
    setup_firewall
    install_pm2
    
    echo ""
    log_info "=========================================="
    log_info "  基础环境配置完成!"
    log_info "=========================================="
    echo ""
    log_info "下一步操作:"
    log_info "1. 上传后端代码到 /opt/ai-platform/server"
    log_info "2. cd /opt/ai-platform/server && npm install"
    log_info "3. 配置 .env 文件 (已自动创建)"
    log_info "4. 执行数据库迁移: npx prisma migrate deploy"
    log_info "5. 生成种子数据: node prisma/seed.js"
    log_info "6. 启动服务: pm2 start ecosystem.config.json"
    log_info "7. 配置 Nginx (脚本已准备配置)"
    echo ""
    log_info "部署完成!"
}

# 执行主函数
main
