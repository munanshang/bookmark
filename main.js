const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'config.json');

console.log('配置文件路径:', configPath);
console.log('用户数据目录:', app.getPath('userData'));

// 读取配置
function readConfig() {
  try {
    console.log('检查配置文件是否存在:', fs.existsSync(configPath));
    if (fs.existsSync(configPath)) {
      // 使用UTF-8编码读取文件
      const data = fs.readFileSync(configPath, 'utf8');
      console.log('配置文件内容长度:', data.length);
      
      // 清理可能的BOM和特殊字符
      let cleanData = data.trim();
      if (cleanData.charCodeAt(0) === 0xFEFF) {
        cleanData = cleanData.slice(1);
      }
      
      console.log('清理后的配置内容:', cleanData);
      
      // 检查是否为空或无效内容
      if (!cleanData) {
        console.log('配置文件内容为空');
        return getDefaultConfig();
      }
      
      const config = JSON.parse(cleanData);
      console.log('配置解析成功:', config);
      
      // 确保配置对象有所有必需的属性
      const fullConfig = {
        username: config.username || '',
        repo: config.repo || '',
        filePath: config.filePath || 'bookmarks.json',
        token: config.token || '',
        useMirror: config.useMirror !== undefined ? config.useMirror : false  // 确保useMirror属性存在
      };
      
      console.log('返回完整配置:', fullConfig);
      return fullConfig;
    } else {
      console.log('配置文件不存在，返回默认配置');
      return getDefaultConfig();
    }
  } catch (error) {
    console.error('读取配置失败:', error);
    console.error('错误类型:', error.constructor.name);
    console.error('错误堆栈:', error.stack);
    return getDefaultConfig();
  }
}

// 获取默认配置
function getDefaultConfig() {
  return {
    username: '',
    repo: '',
    filePath: 'bookmarks.json',
    token: '',
    useMirror: false  // 添加镜像加速选项，默认关闭
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
      token: config.token || '',
      useMirror: config.useMirror !== undefined ? config.useMirror : false  // 确保useMirror属性存在
    };
    
    console.log('准备保存的配置:', fullConfig);
    
    // 使用UTF-8编码写入文件，不带BOM
    fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2), { encoding: 'utf8' });
    console.log('配置保存成功');
    return { success: true };
  } catch (error) {
    console.error('保存配置失败:', error);
    return { success: false, error: error.message };
  }
}

// 添加读取本地书签文件的函数
function readLocalBookmarks() {
  try {
    const localPath = path.join(__dirname, 'bookmarks.json');
    console.log('尝试读取本地书签文件:', localPath);
    
    if (fs.existsSync(localPath)) {
      const data = fs.readFileSync(localPath, 'utf8');
      console.log('本地文件内容大小:', data.length);
      
      // 清理可能的BOM和特殊字符
      let cleanData = data.trim();
      if (cleanData.charCodeAt(0) === 0xFEFF) {
        cleanData = cleanData.slice(1);
      }
      
      const jsonData = JSON.parse(cleanData);
      console.log('本地书签文件解析成功');
      console.log('解析后的数据:', jsonData);
      return { success: true, data: jsonData };
    } else {
      console.log('本地书签文件不存在');
      return { success: false, error: '本地书签文件不存在' };
    }
  } catch (error) {
    console.error('读取本地书签文件失败:', error);
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

  // 在开发模式下加载Vite开发服务器，在生产模式下加载本地文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  // 默认关闭开发者工具
  // mainWindow.webContents.openDevTools(); // 注释掉这行以默认关闭开发者工具
  
  // 监听键盘事件，F12键切换开发者工具
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });
  
  return mainWindow; // 返回窗口实例
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  const mainWindow = createWindow();

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
  console.log('接收到读取书签请求:', url);
  
  try {
    // 构造请求头
    const headers = {
      'User-Agent': 'BookmarkManager/1.0'
    };
    
    // 获取配置以检查是否需要token
    const config = readConfig();
    if (config.token) {
      headers['Authorization'] = `token ${config.token}`;
    }
    
    console.log('请求头:', headers);
    
    // 使用axios发起请求
    const response = await axios.get(url, {
      headers,
      timeout: 30000,
      responseType: 'text'
    });
    
    console.log('响应状态:', response.status);
    
    // 检查响应的内容类型
    const contentType = response.headers['content-type'] || '';
    console.log('内容类型:', contentType);
    
    const text = response.data;
    console.log('响应文本大小:', text.length);
    
    if (!text.trim()) {
      throw new Error('服务器返回空内容');
    }
    
    // 尝试解析JSON，即使内容类型不是application/json
    let data;
    try {
      data = JSON.parse(text);
      console.log('JSON解析成功');
    } catch (parseError) {
      // 如果解析失败，检查是否是GitHub的HTML页面
      if (contentType.includes('text/html')) {
        throw new Error('请确认输入的是正确的GitHub用户名和仓库名，而不是页面URL');
      }
      throw new Error('文件内容不是有效的JSON格式: ' + parseError.message);
    }
    
    console.log('返回成功响应');
    return { success: true, data };
  } catch (error) {
    console.error('加载书签失败:', error);
    let errorMessage = error.message;
    if (error.code === 'ECONNRESET') {
      errorMessage = '网络连接重置，请检查网络连接或稍后重试';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '请求超时，请检查网络连接或稍后重试';
    } else if (error.response) {
      errorMessage = `HTTP错误 ${error.response.status}: ${error.response.statusText}`;
    }
    return { success: false, error: errorMessage };
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

// 添加处理本地书签文件读取的IPC处理程序
ipcMain.handle('load-local-bookmarks', async () => {
  console.log('接收到本地书签文件读取请求');
  return readLocalBookmarks();
});

// 添加切换开发者工具的IPC处理程序
ipcMain.handle('toggle-devtools', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools();
  } else {
    win.webContents.openDevTools();
  }
});
