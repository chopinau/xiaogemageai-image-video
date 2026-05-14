import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('114.132.163.162', username='root', password='060947DIAo', timeout=10)

print('=== 1. Backend Process ===')
stdin, stdout, stderr = ssh.exec_command('pm2 status 2>&1 | head -20')
print(stdout.read().decode())

print('=== 2. Direct API Health ===')
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP_CODE:%{http_code}" http://localhost:3000/api/health')
print(stdout.read().decode())

print('=== 3. Direct API Login ===')
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@ai.com","password":"admin123"}\'')
print(stdout.read().decode()[:500])

print('=== 4. Direct API Image Generate ===')
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP_CODE:%{http_code}" -X POST http://localhost:3000/api/image/generate -H "Content-Type: application/json" -d \'{"prompt":"test","model":"gpt-image-2","resolution":"1024x1024"}\'')
print(stdout.read().decode()[:500])

print('=== 5. Nginx Proxy Test ===')
stdin, stdout, stderr = ssh.exec_command('curl -s -w "\\nHTTP_CODE:%{http_code}" http://ps.xiaomageai.com/api/health')
print(stdout.read().decode()[:500])

print('=== 6. Nginx Config ===')
stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-available/ai-saas 2>/dev/null || echo "NOT FOUND"; ls /etc/nginx/sites-enabled/ 2>/dev/null')
print(stdout.read().decode())

print('=== 7. Nginx Error Log (last 10) ===')
stdin, stdout, stderr = ssh.exec_command('tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No error log"')
print(stdout.read().decode())

print('=== 8. Frontend dist check ===')
stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/ai-saas/dist/ 2>/dev/null | head -10; head -5 /var/www/ai-saas/dist/index.html 2>/dev/null')
print(stdout.read().decode())

print('=== 9. Backend .env ===')
stdin, stdout, stderr = ssh.exec_command('cat /var/www/ai-saas/server/.env 2>/dev/null')
print(stdout.read().decode())

print('=== 10. Backend startup log ===')
stdin, stdout, stderr = ssh.exec_command('pm2 logs ai-saas-api --lines 20 --nostream 2>&1')
print(stdout.read().decode()[:1000])

ssh.close()
