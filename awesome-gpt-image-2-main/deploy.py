import paramiko
import os

# 服务器配置
SERVER_IP = "114.132.163.162"
SERVER_USER = "root"
SERVER_PASS = "060947DIAo"
LOCAL_DIR = r"d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main"
REMOTE_DIR = "/opt/ai-platform"

def upload_directory(sftp, local_path, remote_path):
    """上传目录到服务器"""
    for item in os.listdir(local_path):
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
            print(f"上传: {local_item}")
            sftp.put(local_item, remote_item)

def main():
    print("==========================================")
    print("  部署更新到腾讯云服务器")
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
        stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {REMOTE_DIR}")
        stdout.channel.recv_exit_status()
        
        print("[1/3] 上传前端文件...")
        sftp = ssh.open_sftp()
        
        # 上传dist目录
        dist_local = os.path.join(LOCAL_DIR, "dist")
        dist_remote = f"{REMOTE_DIR}/dist"
        
        print(f"本地目录: {dist_local}")
        print(f"远程目录: {dist_remote}")
        
        # 删除旧的dist目录
        print("删除旧的dist目录...")
        stdin, stdout, stderr = ssh.exec_command(f"rm -rf {dist_remote}")
        stdout.channel.recv_exit_status()
        
        sftp.mkdir(dist_remote)
        upload_directory(sftp, dist_local, dist_remote)
        print("前端文件上传完成!")
        
        print()
        print("[2/3] 上传后端代码...")
        
        # 上传server目录
        server_local = os.path.join(LOCAL_DIR, "server")
        server_remote = f"{REMOTE_DIR}/server"
        
        print(f"本地目录: {server_local}")
        print(f"远程目录: {server_remote}")
        
        # 删除旧的server目录
        print("删除旧的server目录...")
        stdin, stdout, stderr = ssh.exec_command(f"rm -rf {server_remote}")
        stdout.channel.recv_exit_status()
        
        sftp.mkdir(server_remote)
        upload_directory(sftp, server_local, server_remote)
        print("后端代码上传完成!")
        
        sftp.close()
        
        print()
        print("[3/3] 在服务器上执行部署...")
        
        # 执行部署命令
        commands = [
            "cd /opt/ai-platform/server",
            "pm2 stop ai-platform-backend 2>/dev/null || true",
            "npm install --production",
            "pm2 start server.js --name ai-platform-backend",
            "pm2 save"
        ]
        
        command = "; ".join(commands)
        print(f"执行命令: {command}")
        stdin, stdout, stderr = ssh.exec_command(command)
        exit_status = stdout.channel.recv_exit_status()
        
        # 获取输出
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if output:
            print("标准输出:", output)
        if error:
            print("错误输出:", error)
        
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
