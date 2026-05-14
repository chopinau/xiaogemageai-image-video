import paramiko

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

def main():
    print("==========================================")
    print("  检查服务器日志和状态")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 检查PM2状态
        print("检查PM2状态...")
        stdin, stdout, stderr = ssh.exec_command("pm2 status")
        output = stdout.read().decode('utf-8')
        print(output)
        
        # 检查服务日志
        print()
        print("检查服务日志...")
        stdin, stdout, stderr = ssh.exec_command("pm2 logs ai-platform-backend --lines 50")
        output = stdout.read().decode('utf-8')
        print(output[-3000:] if len(output) > 3000 else output)
        
        ssh.close()
        
    except Exception as e:
        print(f"检查过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
