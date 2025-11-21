const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');

// 读取配置
function readConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      return config;
    }
  } catch (error) {
    console.error('读取配置失败:', error);
  }
  return {
    username: '',
    repo: '',
    filePath: 'bookmarks.json',
    token: ''
  };
}

// 保存配置
function saveConfig(config) {
  try {
    // 确保目录存在
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    // 确保配置对象有所有必需的属性
    const fullConfig = {
      username: config.username || '',
      repo: config.repo || '',
      filePath: config.filePath || 'bookmarks.json',
      token: config.token || ''
    };
    
    fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
    return { success: true };
  } catch (error) {
    console.error('保存配置失败:', error);
    return { success: false, error: error.message };
  }
}

// 创建浏览器窗口
function createWindow() {
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  const mainWindow = new BrowserWindow({
    width: Math.min(1200, width * 0.8),
    height: Math.min(800, height * 0.8),
    frame: false, // 无边框窗口
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 打开开发者工具
  // mainWindow.webContents.openDevTools();
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 通常在 macOS 上，当点击停靠栏图标且没有其他窗口打开时，会重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC处理程序
ipcMain.handle('read-bookmarks', async (event, url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-bookmarks', async (event, data) => {
  try {
    // 在Electron中，我们创建一个下载文件
    const filePath = path.join(app.getPath('downloads'), 'bookmarks.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 退出应用
ipcMain.handle('quit-app', async () => {
  app.quit();
});

// 最小化窗口
ipcMain.handle('minimize-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});

// 最大化/还原窗口
ipcMain.handle('maximize-window', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

// 获取配置
ipcMain.handle('get-config', async () => {
  return readConfig();
});

// 保存配置
ipcMain.handle('save-config', async (event, config) => {
  return saveConfig(config);
});