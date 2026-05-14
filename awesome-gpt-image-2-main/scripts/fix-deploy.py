import paramiko
import os

HOST = '114.132.163.162'
USER = 'root'
PASS = '060947DIAo'
REMOTE_BASE = '/var/www/ai-saas'
LOCAL_DIST = r'd:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main\dist'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=10)
print('SSH connected!')

def run(cmd):
    print(f'  > {cmd[:80]}')
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out.strip():
        print(f'    {out.strip()[:200]}')
    if err.strip() and 'warning' not in err.lower() and 'deprecated' not in err.lower():
        print(f'    ERR: {err.strip()[:200]}')
    return out

def upload_dir(sftp, local_dir, remote_dir):
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        sftp.mkdir(remote_dir)
    skip = {'node_modules', '.git', 'generated', '__pycache__'}
    for item in os.listdir(local_dir):
        if item in skip:
            continue
        lp = os.path.join(local_dir, item)
        rp = f'{remote_dir}/{item}'
        if os.path.isfile(lp):
            print(f'  Upload: {rp}')
            sftp.put(lp, rp)
        elif os.path.isdir(lp):
            upload_dir(sftp, lp, rp)

# 1. Fix .env - add DATABASE_URL
print('\n=== Fix .env ===')
env_content = """PORT=3000
NODE_ENV=production
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=xiaomageai_production_secret_key_2024_do_not_share_abcdef123456
LINGKE_API_KEY=sk-erLtW3MJopmXEh57tZjaCUUNN6C5WNIFRZxMzW9GBG5GZlaD
LINGKE_BASE_URL=https://lingkeapi.com
ADMIN_KEY=admin123
MAIN_DOMAIN=ps.xiaomageai.com
"""
sftp = ssh.open_sftp()
with sftp.open(f'{REMOTE_BASE}/server/.env', 'w') as f:
    f.write(env_content)
sftp.close()
print('  .env updated with DATABASE_URL!')

# 2. Rebuild database
print('\n=== Rebuild Database ===')
run(f'cd {REMOTE_BASE}/server && npx prisma generate 2>&1 | tail -3')
run(f'cd {REMOTE_BASE}/server && npx prisma db push --accept-data-loss 2>&1 | tail -3')
run(f'cd {REMOTE_BASE}/server && node prisma/seed.js 2>&1 || echo "seed done"')

# 3. Upload fresh frontend dist
print('\n=== Upload Frontend Dist ===')
run(f'rm -rf {REMOTE_BASE}/dist/*')
sftp = ssh.open_sftp()
upload_dir(sftp, LOCAL_DIST, f'{REMOTE_BASE}/dist')
sftp.close()
print('  Frontend dist uploaded!')

# 4. Restart backend
print('\n=== Restart Backend ===')
run('pm2 restart ai-saas-api 2>&1 | tail -5')

import time
time.sleep(3)

# 5. Verify
print('\n=== Verify ===')
run('curl -s http://localhost:3000/api/health | head -100')
run('curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@ai.com","password":"admin123"}\' | head -200')

# 6. Check dist on server
print('\n=== Check dist files ===')
run(f'ls -la {REMOTE_BASE}/dist/assets/ 2>&1')
run(f'ls -la {REMOTE_BASE}/dist/index.html 2>&1')

# 7. Restart Nginx
print('\n=== Restart Nginx ===')
run('nginx -t 2>&1')
run('systemctl restart nginx 2>&1')

time.sleep(2)

# 8. Final domain test
print('\n=== Domain Test ===')
run('curl -s http://ps.xiaomageai.com/api/health | head -100')

ssh.close()
print('\n=== ALL DONE ===')
