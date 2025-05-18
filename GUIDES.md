# Docker

Here's how to install docker on different operating systems:

## macOS

1. Visit [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Download the Docker Desktop installer
3. Double-click the downloaded `.dmg` file
4. Drag Docker to your Applications folder
5. Open Docker Desktop from Applications
6. Follow the onboarding tutorial if desired

## Linux

### Ubuntu

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

## Windows

1. Enable WSL2 if not already enabled
2. Visit [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
3. Download the installer
4. Run the installer and follow the prompts
5. Start Docker Desktop from the Start menu

---

## Eric Windows 本地部署指南

### 1. 安裝 docker desktop 到 D槽

下載網址：
[docker desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

 - 將下載好的 Docker Desktop Installer.exe 放到 D:\Docker

 - 開啟 PowerShell 
執行指令：
```bash
D:
```
```bash
cd .\Docker\
```
```bash
Start-Process "D:\Docker\Docker Desktop Installer.exe" -ArgumentList "install", "-accept-license", "--installation-dir=D:\Docker\Docker", "--wsl-default-data-root=D:\Docker\wsl", "--windows-containers-default-data-root=D:\Docker" -Wait
```

跑好後開啟 docker desktop 完成後續安裝

### 2. 安裝依賴

啟動 docker 後執行：

```bash
docker run --name dokploy-redis -p 6379:6379 -d redis
```

```bash
docker run --name dokploy-postgres -e POSTGRES_PASSWORD=amukds4wi9001583845717ad2 -e POSTGRES_USER=dokploy -e POSTGRES_DB=dokploy -p 5432:5432 -d postgres
```

### 3. nvm for Windows

```bash
nvm use 20.9.0
```

### 4. 設定專案

```bash
pnpm i
```

```bash
pnpm run server:script
```

```bash
pnpm dokploy:setup
```

### 5. 啟動專案

```bash
pnpm dokploy:dev
```

### 6. 附錄

#### 新增資料庫欄位

新增後 到 ..\UnieVerse\apps\dokploy> 執行

```bash
pnpm run migration:generate
```

```bash
pnpm run setup
```