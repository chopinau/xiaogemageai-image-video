import paramiko
import os

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"
LOCAL_DIR = r"d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main"
REMOTE_DIR = "/opt/ai-platform"

# 要上传的目录（排除node_modules）
DIRS_TO_UPLOAD = [
    ("dist", "dist"),
    ("server/config", "server/config"),
    ("server/data", "server/data"),
    ("server/middleware", "server/middleware"),
    ("server/prisma", "server/prisma"),
    ("server/routes", "server/routes"),
    ("server/services", "server/services"),
    ("server/utils", "server/utils"),
]

# 要上传的单个文件
FILES_TO_UPLOAD = [
    ("server/.env", "server/.env"),
    ("server/package.json", "server/package.json"),
    ("server/server.js", "server/server.js"),
]

def upload_directory(sftp, local_path, remote_path):
    """上传目录到服务器（排除node_modules）"""
    for item in os.listdir(local_path):
        # 跳过node_modules和.git
        if item == "node_modules" or item == ".git":
            continue
            
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        
        if os.path.isdir(local_item):
            # 创建远程目录
            try:
                sftp.mkdir(remote_item)
            except Exception:
                pass  # 目录已存在
            upload_directory(sftp, local_item, remote_item)
        else:
            sftp.put(local_item, remote_item)

def main():
    print("==========================================")
    print("  快速部署更新到腾讯云服务器")
    print("==========================================")
    print(f"服务器: {SERVER_USER}@{SERVER_IP}")
    print()
    
    try:
        # 建立SSH连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS)
        
        # 先创建远程目录
        print("创建远程目录...")
        stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {REMOTE_DIR}/server")
        stdout.channel.recv_exit_status()
        
        sftp = ssh.open_sftp()
        
        # 上传目录
        for local_dir, remote_dir in DIRS_TO_UPLOAD:
            local_path = os.path.join(LOCAL_DIR, local_dir)
            remote_path = f"{REMOTE_DIR}/{remote_dir}"
            
            if os.path.exists(local_path):
                print(f"上传目录: {local_dir}")
                
                # 删除旧目录
                stdin, stdout, stderr = ssh.exec_command(f"rm -rf {remote_path}")
                stdout.channel.recv_exit_status()
                
                # 创建新目录
                sftp.mkdir(remote_path)
                upload_directory(sftp, local_path, remote_path)
        
        # 上传单个文件
        for local_file, remote_file in FILES_TO_UPLOAD:
            local_path = os.path.join(LOCAL_DIR, local_file)
            remote_path = f"{REMOTE_DIR}/{remote_file}"
            
            if os.path.exists(local_path):
                print(f"上传文件: {local_file}")
                sftp.put(local_path, remote_path)
        
        sftp.close()
        
        print()
        print("在服务器上执行部署...")
        
        # 执行部署命令
        commands = [
            "cd /opt/ai-platform/server",
            "pm2 stop ai-platform-backend 2>/dev/null || true",
            "rm -rf node_modules package-lock.json",
            "npm install --production",
            "pm2 start server.js --name ai-platform-backend",
            "pm2 save"
        ]
        
        command = "; ".join(commands)
        print(f"执行命令: {command}")
        
        # 设置较长的超时时间（npm install可能需要一些时间）
        stdin, stdout, stderr = ssh.exec_command(command, timeout=300)
        exit_status = stdout.channel.recv_exit_status()
        
        # 获取输出
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if output:
            print("标准输出:", output[-2000:] if len(output) > 2000 else output)
        if error:
            print("错误输出:", error[-1000:] if len(error) > 1000 else error)
        
        if exit_status == 0:
            print()
            print("==========================================")
            print("  部署成功!")
            print("==========================================")
            print()
            print(f"访问地址: http://{SERVER_IP}")
            print(f"API地址: http://{SERVER_IP}/api")
        else:
            print(f"部署失败，退出码: {exit_status}")
        
        ssh.close()
        
    except Exception as e:
        print(f"部署过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
