# 腾讯云轻量服务器应用部署与数据库配置指南

## 目录

1. [数据库选择方案对比](#1-数据库选择方案对比)
2. [腾讯云轻量服务器内置 MySQL 配置](#2-腾讯云轻量服务器内置-mysql-配置)
3. [轻量级数据库手动部署](#3-轻量级数据库手动部署)
4. [程序与数据库连接配置](#4-程序与数据库连接配置)
5. [数据库初始化与数据迁移](#5-数据库初始化与数据迁移)
6. [功能验证与问题排查](#6-功能验证与问题排查)

---

## 1. 数据库选择方案对比

### 1.1 MySQL vs SQLite vs PostgreSQL 对比

| 维度 | MySQL | SQLite | PostgreSQL |
|------|-------|--------|------------|
| **适用场景** | 生产环境、高并发、多用户 | 开发测试、单机应用、轻量部署 | 生产环境、复杂查询、数据分析 |
| **性能** | 高吞吐量、支持索引优化 | 轻量快速、适合小规模数据 | 复杂查询优化、全文搜索 |
| **资源占用** | 中高（需独立进程） | 极低（嵌入式） | 中高 |
| **并发支持** | 高（支持连接池） | 低（单写多读） | 高 |
| **远程访问** | 支持 | 不支持（文件访问） | 支持 |
| **数据备份** | 成熟工具支持 | 直接复制文件 | 成熟工具支持 |
| **适用本项目** | 正式生产部署 | 开发测试/演示环境 | 需复杂查询场景 |

### 1.2 推荐选择

- **开发/演示环境**：推荐 **SQLite**（无需额外安装，开箱即用）
- **小规模生产环境**：推荐 **MySQL**（腾讯云内置，配置简单）
- **复杂业务场景**：推荐 **PostgreSQL**（功能强大，适合数据分析）

---

## 2. 腾讯云轻量服务器内置 MySQL 配置

### 2.1 前提条件

1. 已购买腾讯云轻量应用服务器（推荐配置：2核4GB以上）
2. 操作系统：CentOS 7.x / Ubuntu 20.04+
3. 已开放安全组端口（3306 MySQL端口）

### 2.2 步骤1：开启 MySQL 服务

#### 登录腾讯云控制台
1. 进入 [轻量应用服务器控制台](https://console.cloud.tencent.com/lighthouse)
2. 选择目标服务器，点击 **管理**

#### 安装 MySQL（如未预装）

**CentOS/RHEL 系统：**
```bash
# 更新系统
sudo yum update -y

# 安装 MySQL 8.0
sudo yum install -y mysql-community-server

# 启动服务并设置开机自启
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 查看初始密码
sudo grep 'temporary password' /var/log/mysqld.log
```

**Ubuntu/Debian 系统：**
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 MySQL
sudo apt install -y mysql-server

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2.3 步骤2：安全组配置

1. 在服务器管理页面，点击左侧 **安全** -> **防火墙**
2. 点击 **添加规则**：
   - 规则名称：MySQL
   - 协议类型：TCP
   - 端口：3306
   - 授权对象：`0.0.0.0/0`（允许外网访问，生产环境建议限制IP）
3. 点击 **确定**

### 2.4 步骤3：MySQL 账户配置

#### 登录 MySQL
```bash
# 使用初始密码登录
mysql -u root -p
```

#### 修改初始密码
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourNewPassword123!';
FLUSH PRIVILEGES;
```

#### 创建应用数据库和用户
```sql
-- 创建数据库
CREATE DATABASE ai_gen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建应用用户（允许本地访问）
CREATE USER 'ai_gen_user'@'localhost' IDENTIFIED BY 'YourAppPassword!';

-- 授予权限
GRANT ALL PRIVILEGES ON ai_gen_db.* TO 'ai_gen_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 开启远程访问（如需）
```sql
-- 创建允许远程访问的用户
CREATE USER 'ai_gen_user'@'%' IDENTIFIED BY 'YourAppPassword!';
GRANT ALL PRIVILEGES ON ai_gen_db.* TO 'ai_gen_user'@'%';
FLUSH PRIVILEGES;

-- 退出 MySQL
EXIT;
```

#### 修改 MySQL 配置允许远程访问
```bash
# 编辑配置文件
sudo vi /etc/my.cnf  # CentOS
# 或
sudo vi /etc/mysql/mysql.conf.d/mysqld.cnf  # Ubuntu

# 找到 bind-address，修改为：
bind-address = 0.0.0.0

# 保存并重启 MySQL
sudo systemctl restart mysqld  # CentOS
# 或
sudo systemctl restart mysql   # Ubuntu
```

---

## 3. 轻量级数据库手动部署

### 3.1 SQLite（最简单，推荐开发环境）

**无需安装，开箱即用**

1. 确保项目中已存在 `server/prisma/dev.db` 文件
2. 配置连接字符串：
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```

**优势**：
- 无需额外安装数据库服务
- 数据存储在单个文件中
- 适合开发测试和演示环境

**局限性**：
- 不支持并发写入
- 不支持远程访问
- 不适合高并发生产环境

### 3.2 PostgreSQL 部署

#### 安装 PostgreSQL
```bash
# CentOS
sudo yum install -y postgresql-server
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Ubuntu
sudo apt install -y postgresql postgresql-contrib
```

#### 创建数据库和用户
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE ai_gen_db;

# 创建用户
CREATE USER ai_gen_user WITH PASSWORD 'YourPassword!';

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE ai_gen_db TO ai_gen_user;

# 退出
\q
```

#### 允许远程访问
```bash
# 编辑配置文件
sudo vi /var/lib/pgsql/data/pg_hba.conf  # CentOS
# 或
sudo vi /etc/postgresql/14/main/pg_hba.conf  # Ubuntu

# 添加如下行：
host    ai_gen_db     ai_gen_user     0.0.0.0/0     scram-sha-256

# 编辑 postgresql.conf
sudo vi /var/lib/pgsql/data/postgresql.conf  # CentOS
# 或
sudo vi /etc/postgresql/14/main/postgresql.conf  # Ubuntu

# 修改：
listen_addresses = '*'

# 重启服务
sudo systemctl restart postgresql
```

---

## 4. 程序与数据库连接配置

### 4.1 修改 .env 文件

在服务器端的 `server/.env` 文件中配置数据库连接：

#### MySQL 配置
```env
# 数据库配置
DATABASE_URL="mysql://ai_gen_user:YourAppPassword!@localhost:3306/ai_gen_db"

# 或远程连接（不推荐）
# DATABASE_URL="mysql://ai_gen_user:YourAppPassword!@your-server-ip:3306/ai_gen_db"
```

#### SQLite 配置
```env
DATABASE_URL="file:./prisma/dev.db"
```

#### PostgreSQL 配置
```env
DATABASE_URL="postgresql://ai_gen_user:YourPassword!@localhost:5432/ai_gen_db"
```

### 4.2 Prisma Schema 配置

确保 `server/prisma/schema.prisma` 文件配置正确：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"  # 或 "sqlite"、"postgresql"
  url      = env("DATABASE_URL")
}
```

**注意**：切换数据库类型时，需要修改 `provider` 字段：
- MySQL: `provider = "mysql"`
- SQLite: `provider = "sqlite"`
- PostgreSQL: `provider = "postgresql"`

---

## 5. 数据库初始化与数据迁移

### 5.1 安装依赖

```bash
cd /path/to/your/project/server

# 安装依赖
npm install

# 安装 Prisma CLI
npm install prisma --save-dev
```

### 5.2 生成 Prisma Client

```bash
npx prisma generate
```

### 5.3 执行数据库迁移

```bash
# 创建并执行迁移
npx prisma migrate dev --name init

# 或使用 push 命令（不生成迁移文件，直接同步 schema）
npx prisma db push
```

### 5.4 初始化种子数据

```bash
node prisma/seed.js
```

**种子数据包含**：
- 管理员账户：`admin@ai.com` / `admin123`
- 测试用户：`test@ai.com` / `test123`
- 演示用户：`demo@ai.com` / `demo123`

---

## 6. 功能验证与问题排查

### 6.1 启动服务并验证

#### 启动后端服务
```bash
cd /path/to/your/project/server

# 开发模式（测试用）
npm run dev

# 生产模式（推荐使用 PM2）
npm install pm2 -g
pm2 start server.js --name ai-gen-api
pm2 save
pm2 startup
```

#### 验证 API 健康状态

```bash
curl http://localhost:3000/api/health
```

**预期输出**：
```json
{
  "status": "ok",
  "timestamp": 1778604000000,
  "uptime": 10.5,
  "version": "2.0.0",
  "lingkeAPI": "https://lingkeapi.com"
}
```

#### 验证数据库连接

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ai.com","password":"admin123"}'
```

**预期输出**：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ai.com",
      "nickname": "管理员",
      "role": "admin",
      "credits": 9999
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6.2 常见问题排查

#### 问题1：数据库连接失败

**现象**：启动服务时报错 `Unable to open database file` 或 `Connection refused`

**排查步骤**：

1. **检查数据库服务是否运行**：
   ```bash
   # MySQL
   systemctl status mysqld
   
   # PostgreSQL
   systemctl status postgresql
   ```

2. **检查数据库配置是否正确**：
   ```bash
   cat server/.env | grep DATABASE_URL
   ```

3. **检查端口是否开放**：
   ```bash
   # 检查本地端口
   netstat -tlnp | grep 3306
   
   # 检查防火墙规则
   firewall-cmd --list-ports  # CentOS
   ufw status                # Ubuntu
   ```

#### 问题2：Prisma 迁移失败

**现象**：`npx prisma migrate dev` 报错

**排查步骤**：

1. **检查数据库用户权限**：
   ```sql
   SHOW GRANTS FOR 'ai_gen_user'@'localhost';
   ```

2. **检查数据库是否存在**：
   ```sql
   SHOW DATABASES LIKE 'ai_gen_db';
   ```

3. **重新生成 Prisma Client**：
   ```bash
   npx prisma generate --force
   ```

#### 问题3：前端无法访问后端 API

**现象**：前端调用 API 时报错 `Network Error` 或 `CORS` 错误

**排查步骤**：

1. **检查后端服务是否启动**：
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **检查安全组配置**：确保 3000 端口已开放

3. **检查 Nginx 反向代理配置**（如使用）：
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     
     location /api/ {
       proxy_pass http://localhost:3000/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

#### 问题4：登录失败

**现象**：登录接口返回 `邮箱或密码错误`

**排查步骤**：

1. **检查数据库中用户是否存在**：
   ```sql
   SELECT * FROM User WHERE email = 'admin@ai.com';
   ```

2. **检查密码是否正确**：种子用户密码为 `admin123`

3. **重新运行种子文件**：
   ```bash
   node prisma/seed.js
   ```

### 6.3 日志查看与问题定位

```bash
# 查看后端日志
pm2 logs ai-gen-api

# 查看 MySQL 日志
tail -f /var/log/mysqld.log

# 查看系统日志
journalctl -u mysqld -f
```

---

## 附录：常用命令速查表

| 操作 | MySQL | PostgreSQL | SQLite |
|------|-------|------------|--------|
| 启动服务 | `systemctl start mysqld` | `systemctl start postgresql` | 无需启动 |
| 停止服务 | `systemctl stop mysqld` | `systemctl stop postgresql` | 无需停止 |
| 登录 | `mysql -u user -p` | `psql -U user -d db` | `sqlite3 file.db` |
| 查看数据库 | `SHOW DATABASES;` | `\l` | `.databases` |
| 切换数据库 | `USE db;` | `\c db` | `.open file.db` |
| 查看表 | `SHOW TABLES;` | `\dt` | `.tables` |
| 退出 | `EXIT;` | `\q` | `.exit` |

---

## 安全建议

1. **生产环境禁用 root 远程访问**：仅允许应用用户访问
2. **使用强密码**：包含大小写字母、数字、特殊字符
3. **限制安全组规则**：仅允许信任的 IP 访问数据库端口
4. **定期备份数据库**：
   ```bash
   # MySQL 备份
   mysqldump -u ai_gen_user -p ai_gen_db > backup.sql
   
   # PostgreSQL 备份
   pg_dump -U ai_gen_user ai_gen_db > backup.sql
   
   # SQLite 备份（直接复制文件）
   cp server/prisma/dev.db server/prisma/dev.db.backup
   ```
5. **开启数据库日志审计**：便于追踪异常操作