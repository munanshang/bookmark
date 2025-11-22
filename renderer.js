// renderer.js - Electron渲染进程逻辑
document.addEventListener('DOMContentLoaded', () => {
    // 窗口控制按钮
    document.getElementById('minimizeBtn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });
    
    document.getElementById('maximizeBtn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });
    
    document.getElementById('closeBtn').addEventListener('click', () => {
        window.electronAPI.quitApp();
    });
    
    // 标签页切换
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新激活状态
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切换内容
            const tabName = tab.textContent.trim() === '主界面' ? 'main' : 'settings';
            if (tabName === 'main') {
                document.querySelector('.main-container:nth-child(1)').classList.remove('hidden');
                document.querySelector('.main-container:nth-child(2)').classList.add('hidden');
            } else {
                document.querySelector('.main-container:nth-child(1)').classList.add('hidden');
                document.querySelector('.main-container:nth-child(2)').classList.remove('hidden');
                loadSettings();
            }
        });
    });
    
    // 切换Token输入框显示
    const toggleTokenBtn = document.getElementById('toggleTokenBtn');
    const tokenGroup = document.getElementById('tokenGroup');
    if (toggleTokenBtn && tokenGroup) {
        toggleTokenBtn.addEventListener('click', () => {
            const isHidden = tokenGroup.style.display === 'none';
            tokenGroup.style.display = isHidden ? 'block' : 'none';
            toggleTokenBtn.textContent = isHidden ? '隐藏Token' : '需要Token?';
        });
    }
    
    // 保存设置
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // 刷新书签
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadBookmarks);
    }
    
    // 页面加载时加载配置并自动加载书签
    loadSettings().then(() => {
        // 检查是否已配置GitHub信息
        const githubUsername = document.getElementById('githubUsername');
        const githubRepo = document.getElementById('githubRepo');
        
        if (githubUsername && githubRepo && 
            githubUsername.value.trim() && githubRepo.value.trim()) {
            // 如果已配置，自动加载书签
            loadBookmarks();
        } else {
            // 如果未配置，自动切换到设置页面
            document.getElementById('statusBar').textContent = '请先配置GitHub信息';
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
            document.querySelector('.main-container:nth-child(1)').classList.add('hidden');
            document.querySelector('.main-container:nth-child(2)').classList.remove('hidden');
        }
    });
});

// 加载设置
async function loadSettings() {
    try {
        const config = await window.electronAPI.getConfig();
        const githubUsername = document.getElementById('githubUsername');
        const githubRepo = document.getElementById('githubRepo');
        const githubFilePath = document.getElementById('githubFilePath');
        const settingsToken = document.getElementById('settingsToken');
        
        if (githubUsername) githubUsername.value = config.username || '';
        if (githubRepo) githubRepo.value = config.repo || '';
        if (githubFilePath) githubFilePath.value = config.filePath || 'bookmarks.json';
        if (settingsToken) settingsToken.value = config.token || '';
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// 保存设置
async function saveSettings() {
    try {
        const githubUsername = document.getElementById('githubUsername');
        const githubRepo = document.getElementById('githubRepo');
        const githubFilePath = document.getElementById('githubFilePath');
        const settingsToken = document.getElementById('settingsToken');
        const statusBar = document.getElementById('statusBar');
        
        const config = {
            username: githubUsername ? githubUsername.value.trim() : '',
            repo: githubRepo ? githubRepo.value.trim() : '',
            filePath: githubFilePath ? (githubFilePath.value.trim() || 'bookmarks.json') : 'bookmarks.json',
            token: settingsToken ? settingsToken.value.trim() : ''
        };
        
        const result = await window.electronAPI.saveConfig(config);
        
        if (result.success) {
            statusBar.textContent = '设置已保存';
            // 保存配置后自动刷新书签
            loadBookmarks();
        } else {
            statusBar.textContent = '保存设置失败: ' + result.error;
        }
    } catch (error) {
        document.getElementById('statusBar').textContent = '保存设置失败: ' + error.message;
    }
}

// 从GitHub加载书签
async function loadBookmarks() {
    const githubUsername = document.getElementById('githubUsername');
    const githubRepo = document.getElementById('githubRepo');
    const githubFilePath = document.getElementById('githubFilePath');
    const statusBar = document.getElementById('statusBar');
    
    if (!githubUsername || !githubRepo || 
        !githubUsername.value.trim() || !githubRepo.value.trim()) {
        statusBar.textContent = '请先在设置页面配置GitHub用户名和仓库名';
        // 切换到设置页面
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
        document.querySelector('.main-container:nth-child(1)').classList.add('hidden');
        document.querySelector('.main-container:nth-child(2)').classList.remove('hidden');
        loadSettings();
        return;
    }
    
    try {
        statusBar.textContent = '正在加载书签数据...';
        
        // 构造GitHub原始文件URL
        const filePath = githubFilePath && githubFilePath.value.trim() || 'bookmarks.json';
        const rawUrl = `https://raw.githubusercontent.com/${githubUsername.value.trim()}/${githubRepo.value.trim()}/main/${filePath}`;
        
        // 发送请求到主进程处理
        const result = await window.electronAPI.readBookmarks(rawUrl);
        
        if (result.success) {
            statusBar.textContent = '书签数据加载成功';
            // 这里可以处理书签数据的渲染
            console.log('书签数据:', result.data);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('加载错误：', error);
        statusBar.textContent = `加载失败：${error.message}`;
    }
}