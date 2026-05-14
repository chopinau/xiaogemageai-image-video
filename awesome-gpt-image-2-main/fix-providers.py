import paramiko
import tempfile
import os

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"

# 供应商配置内容（正确格式）
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
    print("  修复服务器上的供应商配置")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 创建本地临时文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
            f.write(PROVIDERS_CONFIG)
            temp_path = f.name
        
        print(f"创建临时文件: {temp_path}")
        
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 使用SFTP上传文件
        print("上传供应商配置文件...")
        sftp = ssh.open_sftp()
        remote_path = "/opt/ai-platform/server/data/upstreamProviders.json"
        sftp.put(temp_path, remote_path)
        sftp.close()
        print("供应商配置文件已上传")
        
        # 删除本地临时文件
        os.unlink(temp_path)
        print("删除本地临时文件")
        
        # 验证文件内容
        print()
        print("验证上传的文件内容...")
        stdin, stdout, stderr = ssh.exec_command("cat /opt/ai-platform/server/data/upstreamProviders.json")
        content = stdout.read().decode('utf-8')
        print(content)
        
        # 验证JSON格式
        print()
        print("验证JSON格式...")
        stdin, stdout, stderr = ssh.exec_command("python3 -c \"import json; json.load(open('/opt/ai-platform/server/data/upstreamProviders.json')); print('JSON格式正确')\"")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status == 0:
            print("JSON格式验证通过!")
        else:
            error = stderr.read().decode('utf-8')
            print(f"JSON格式错误: {error}")
        
        # 重启服务使配置生效
        print()
        print("重启后端服务...")
        stdin, stdout, stderr = ssh.exec_command("cd /opt/ai-platform/server && pm2 stop ai-platform-backend && pm2 start server.js --name ai-platform-backend && pm2 save")
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("服务重启成功!")
        else:
            error = stderr.read().decode('utf-8')
            print(f"服务重启失败: {error}")
        
        ssh.close()
        
        print()
        print("==========================================")
        print("  供应商配置修复完成!")
        print("==========================================")
        
    except Exception as e:
        print(f"修复过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
