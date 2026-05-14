import paramiko

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

# 供应商配置内容
PROVIDERS_CONFIG = '''{
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
'''

def main():
    print("==========================================")
    print("  更新服务器上的供应商配置")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 写入供应商配置文件
        print("更新供应商配置文件...")
        sftp = ssh.open_sftp()
        remote_path = "/opt/ai-platform/server/data/upstreamProviders.json"
        sftp.putfo(open('temp_providers.json', 'w').write(PROVIDERS_CONFIG), remote_path)
        
        # 实际上需要先写入本地临时文件再上传
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(PROVIDERS_CONFIG)
            temp_path = f.name
        
        sftp.put(temp_path, remote_path)
        print("供应商配置文件已更新")
        
        # 删除本地临时文件
        import os
        os.unlink(temp_path)
        
        sftp.close()
        
        # 重启服务使配置生效
        print()
        print("重启后端服务...")
        commands = [
            "pm2 stop ai-platform-backend 2>/dev/null || true",
            "pm2 start server.js --name ai-platform-backend",
            "pm2 save"
        ]
        
        command = "; ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(f"cd /opt/ai-platform/server && {command}")
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("服务重启成功!")
        else:
            error = stderr.read().decode('utf-8')
            print(f"服务重启失败: {error}")
        
        ssh.close()
        
        print()
        print("==========================================")
        print("  供应商配置更新完成!")
        print("==========================================")
        
    except Exception as e:
        print(f"更新过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
