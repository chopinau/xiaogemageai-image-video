@echo off
REM AI 后端服务部署脚本 - Windows 版
REM 用于将代码上传到腾讯云服务器并部署

echo ==========================================
echo   AI 后端服务部署工具
echo ==========================================
echo.

set SERVER_IP=114.132.163.162
set SERVER_USER=root
set SERVER_PASS=060947DIAo!
set PROJECT_DIR=d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main

echo [INFO] 服务器: %SERVER_USER%@%SERVER_IP%
echo.

REM 第一步: 使用 SSH 连接并运行环境配置脚本
echo [INFO] 步骤 1: 上传并运行环境配置脚本...
echo.

REM 先使用 plink 或 ssh 上传并执行部署脚本
REM 注意: 这里假设您已安装 Git for Windows (带有 ssh 和 scp)

REM 方法 1: 如果有 pscp (PuTTY)
REM pscp -pw %SERVER_PASS% deploy-server.sh %SERVER_USER%@%SERVER_IP%:/tmp/
REM plink -pw %SERVER_PASS% %SERVER_USER%@%SERVER_IP% "chmod +x /tmp/deploy-server.sh && /tmp/deploy-server.sh"

REM 方法 2: 使用 PowerShell 和 SSH (推荐)
echo.
echo [WARNING] 由于 SSH 需要交互式输入密码，请按以下步骤操作:
echo.
echo 1. 手动连接到服务器:
echo    ssh %SERVER_USER%@%SERVER_IP%
echo.
echo 2. 在服务器上创建并执行以下命令:
echo.
echo    cat ^> /tmp/deploy-server.sh ^<^<'EOF'
echo    (复制 deploy-server.sh 的内容粘贴进去)
echo    EOF
echo.
echo    chmod +x /tmp/deploy-server.sh
echo    /tmp/deploy-server.sh
echo.
echo 3. 环境配置完成后，继续执行本脚本的后续步骤
echo.

pause

REM 第二步: 上传代码
echo.
echo [INFO] 步骤 2: 上传后端代码到服务器...
echo.
echo 请使用以下命令上传代码 (在另一个终端中执行):
echo.
echo cd "%PROJECT_DIR%"
echo scp -r server/ %SERVER_USER%@%SERVER_IP%:/opt/ai-platform/
echo.

pause

REM 第三步: 在服务器上安装依赖和启动
echo.
echo [INFO] 步骤 3: 在服务器上安装依赖并启动服务...
echo.
echo SSH 连接到服务器后执行:
echo.
echo cd /opt/ai-platform/server
echo npm install
echo npx prisma migrate deploy
echo node prisma/seed.js
echo.
echo # 配置 Nginx
echo cat ^> /etc/nginx/sites-available/ai-platform ^<^<'EOF'
echo server {
echo     listen 80;
echo     server_name _;
echo.
echo     location /api {
echo         proxy_pass http://localhost:3000;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade \$http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host \$host;
echo         proxy_cache_bypass \$http_upgrade;
echo         proxy_set_header X-Real-IP \$remote_addr;
echo         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto \$scheme;
echo     }
echo.
echo     client_max_body_size 100M;
echo }
echo EOF
echo.
echo ln -sf /etc/nginx/sites-available/ai-platform /etc/nginx/sites-enabled/
echo rm -f /etc/nginx/sites-enabled/default
echo nginx -t
echo systemctl restart nginx
echo.
echo # 使用 PM2 启动服务
echo cd /opt/ai-platform/server
echo pm2 start server.js --name ai-platform-backend
echo pm2 save
echo pm2 startup
echo.

echo ==========================================
echo   部署步骤已准备完成!
echo ==========================================
echo.
echo 访问地址: http://%SERVER_IP%
echo API 文档: http://%SERVER_IP%/api
echo.
pause
