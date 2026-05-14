import paramiko

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

def main():
    print("==========================================")
    print("  检查服务器上的供应商配置")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 检查文件是否存在
        print("检查供应商配置文件...")
        stdin, stdout, stderr = ssh.exec_command("ls -la /opt/ai-platform/server/data/")
        output = stdout.read().decode('utf-8')
        print("data目录内容:")
        print(output)
        
        # 查看文件内容
        stdin, stdout, stderr = ssh.exec_command("cat /opt/ai-platform/server/data/upstreamProviders.json")
        content = stdout.read().decode('utf-8')
        print("供应商文件内容:")
        print(content)
        
        ssh.close()
        
    except Exception as e:
        print(f"检查过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
