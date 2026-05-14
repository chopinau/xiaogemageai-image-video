import paramiko
import os
import sys
import stat

HOST = '114.132.163.162'
USER = 'root'
PASS = "060947DIAo"
REMOTE_BASE = '/var/www/ai-saas'
LOCAL_SERVER = r'd:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main\server'
LOCAL_DIST = r'd:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main\dist'

def ssh_exec(ssh, cmd):
    print(f'  > {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(f'    {out.strip()[:200]}')
    if err.strip() and 'warning' not in err.lower():
        print(f'    ERR: {err.strip()[:200]}')
    return out, err

def upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    
    skip_dirs = {'node_modules', '.git', 'generated', '__pycache__'}
    skip_files = {'.DS_Store', 'Thumbs.db'}
    
    for item in os.listdir(local_dir):
        if item in skip_dirs or item in skip_files:
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = f'{remote_dir}/{item}'
        
        if os.path.isfile(local_path):
            print(f'  Upload: {remote_path}')
            sftp.put(local_path, remote_path)
        elif os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)

def main():
    print('=== 连接服务器 ===')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print('  连接成功!')

    print('\n=== 创建目录 ===')
    ssh_exec(ssh, f'mkdir -p {REMOTE_BASE}/server {REMOTE_BASE}/dist')

    print('\n=== 上传后端代码 ===')
    sftp = ssh.open_sftp()
    upload_dir(sftp, LOCAL_SERVER, f'{REMOTE_BASE}/server')
    sftp.close()
    print('  后端代码上传完成!')

    print('\n=== 上传前端构建 ===')
    sftp = ssh.open_sftp()
    if os.path.exists(LOCAL_DIST):
        upload_dir(sftp, LOCAL_DIST, f'{REMOTE_BASE}/dist')
        print('  前端构建上传完成!')
    else:
        print('  前端 dist 目录不存在，跳过')
    sftp.close()

    print('\n=== 安装 Node.js (如需要) ===')
    ssh_exec(ssh, 'which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)')

    print('\n=== 安装后端依赖 ===')
    ssh_exec(ssh, f'cd {REMOTE_BASE}/server && npm install --production 2>&1 | tail -5')

    print('\n=== 安装 PM2 ===')
    ssh_exec(ssh, 'npm install -g pm2 2>&1 | tail -3')

    print('\n=== 创建 .env 文件 ===')
    env_content = """PORT=3000
NODE_ENV=production
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=xiaomageai_production_secret_key_2024_do_not_share_abcdef123456
LINGKE_API_KEY=sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD
LINGKE_BASE_URL=https://lingkeapi.com
ADMIN_KEY=admin123
MAIN_DOMAIN=ps.xiaomageai.com"""
    
    sftp = ssh.open_sftp()
    with sftp.open(f'{REMOTE_BASE}/server/.env', 'w') as f:
        f.write(env_content)
    sftp.close()
    print('  .env 文件创建完成!')

    print('\n=== 生成 Prisma 客户端 ===')
    ssh_exec(ssh, f'cd {REMOTE_BASE}/server && npx prisma generate 2>&1 | tail -3')

    print('\n=== 初始化数据库 ===')
    ssh_exec(ssh, f'cd {REMOTE_BASE}/server && npx prisma db push --accept-data-loss 2>&1 | tail -3')

    print('\n=== 初始化种子数据 ===')
    ssh_exec(ssh, f'cd {REMOTE_BASE}/server && node prisma/seed.js 2>&1 || echo "种子数据已存在"')

    print('\n=== 启动后端服务 ===')
    ssh_exec(ssh, 'pm2 stop ai-saas-api 2>/dev/null; pm2 delete ai-saas-api 2>/dev/null; true')
    ssh_exec(ssh, f'cd {REMOTE_BASE}/server && pm2 start server.js --name ai-saas-api 2>&1 | tail -5')
    ssh_exec(ssh, 'pm2 save 2>&1 | tail -3')
    ssh_exec(ssh, 'pm2 startup systemd -u root --hp /root 2>&1 | tail -3 || true')

    print('\n=== 配置 Nginx ===')
    nginx_conf = """server {
    listen 80;
    server_name ps.xiaomageai.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 120s;
    }

    location / {
        root /var/www/ai-saas/dist;
        try_files $uri $uri/ /index.html;
    }
}"""
    
    sftp = ssh.open_sftp()
    with sftp.open('/etc/nginx/sites-available/ai-saas', 'w') as f:
        f.write(nginx_conf)
    sftp.close()
    
    ssh_exec(ssh, 'ln -sf /etc/nginx/sites-available/ai-saas /etc/nginx/sites-enabled/')
    ssh_exec(ssh, 'nginx -t 2>&1')
    ssh_exec(ssh, 'systemctl restart nginx 2>&1')

    print('\n=== 验证服务 ===')
    import time
    time.sleep(3)
    ssh_exec(ssh, 'curl -s http://localhost:3000/api/health | head -100')
    ssh_exec(ssh, 'curl -s http://ps.xiaomageai.com/api/health | head -100 || echo "域名访问待验证"')

    ssh.close()
    print('\n=== 部署完成! ===')
    print(f'后端 API: http://{HOST}:3000')
    print(f'前端页面: https://ps.xiaomageai.com')
    print('账号: admin@ai.com / admin123')

if __name__ == '__main__':
    main()
