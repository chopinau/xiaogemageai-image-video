import paramiko

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

def main():
    print("==========================================")
    print("  验证服务器配置")
    print("==========================================")
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 检查各项配置
        checks = [
            ("部署脚本", "ls -la /root/deploy.sh"),
            ("Nginx配置", "ls -la /etc/nginx/sites-available/ps.xiaomageai.com"),
            ("Nginx状态", "nginx -t 2>&1"),
            ("PM2状态", "pm2 status"),
            ("项目目录", "ls -la /root/xiaogemageai-image-video/"),
            ("域名目录", "ls -la /var/www/ps.xiaomageai.com/"),
            ("部署日志目录", "ls -la /var/log/deploy/"),
        ]
        
        for name, cmd in checks:
            print(f"\n📋 检查: {name}")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            output = stdout.read().decode('utf-8')
            error = stderr.read().decode('utf-8')
            if output:
                print(output[:500])
            if error:
                print(error[:500])
        
        # 测试域名访问
        print("\n🌐 测试域名访问:")
        stdin, stdout, stderr = ssh.exec_command("curl -o /dev/null -s -w 'HTTP状态码: %{http_code}' http://ps.xiaomageai.com")
        output = stdout.read().decode('utf-8')
        print(output)
        
        # 测试API访问
        print("\n🔌 测试API访问:")
        stdin, stdout, stderr = ssh.exec_command("curl -o /dev/null -s -w 'HTTP状态码: %{http_code}' http://ps.xiaomageai.com/api/health")
        output = stdout.read().decode('utf-8')
        print(output)
        
        ssh.close()
        
    except Exception as e:
        print(f"验证过程中发生错误: {str(e)}")

if __name__ == "__main__":
    main()
