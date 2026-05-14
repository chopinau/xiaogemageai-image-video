import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('114.132.163.162', username='root', password='060947DIAo', timeout=10)

stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3000/api/health')
print('=== Health Check ===')
print(stdout.read().decode()[:200])

stdin, stdout, stderr = ssh.exec_command('curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@ai.com","password":"admin123"}\'')
print('\n=== Login Test ===')
print(stdout.read().decode()[:300])

stdin, stdout, stderr = ssh.exec_command('curl -s http://ps.xiaomageai.com/api/health')
print('\n=== Domain Access ===')
print(stdout.read().decode()[:200])

stdin, stdout, stderr = ssh.exec_command('pm2 status')
print('\n=== PM2 Status ===')
print(stdout.read().decode()[:500])

ssh.close()
