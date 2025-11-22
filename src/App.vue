<template>
  <div id="app">
    <div class="header">
      <h1><n-icon size="18"><Bookmark /></n-icon> 书签云管理工具</h1>
      <div class="window-controls">
        <n-button class="window-btn" @click="minimizeWindow" text>
          <n-icon size="12"><Remove /></n-icon>
        </n-button>
        <n-button class="window-btn" @click="maximizeWindow" text>
          <n-icon size="12"><SquareOutline /></n-icon>
        </n-button>
        <n-button class="window-btn close" @click="quitApp" text>
          <n-icon size="12"><Close /></n-icon>
        </n-button>
      </div>
    </div>
    
    <div class="nav-tabs">
      <div 
        class="nav-tab" 
        :class="{ active: $route.path === '/' }"
        @click="$router.push('/')"
      >
        主页
      </div>
      <div 
        class="nav-tab" 
        :class="{ active: $route.path === '/settings' }"
        @click="$router.push('/settings')"
      >
        设置
      </div>
    </div>
    
    <router-view></router-view>
    
    <div class="status-bar" id="statusBar">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// 引入NaiveUI图标组件
import { Bookmark, Remove, SquareOutline, Close } from '@vicons/ionicons5'

export default {
  name: 'App',
  components: {
    Bookmark,
    Remove,
    SquareOutline,
    Close
  },
  setup() {
    const router = useRouter()
    const statusMessage = ref('就绪')
    
    const updateStatus = (message) => {
      statusMessage.value = message
    }
    
    const minimizeWindow = () => {
      if (window.electronAPI && window.electronAPI.minimizeWindow) {
        window.electronAPI.minimizeWindow()
      } else {
        console.log('Minimize window - Electron API not available')
      }
    }
    
    const maximizeWindow = () => {
      if (window.electronAPI && window.electronAPI.maximizeWindow) {
        window.electronAPI.maximizeWindow()
      } else {
        console.log('Maximize window - Electron API not available')
      }
    }
    
    const quitApp = () => {
      if (window.electronAPI && window.electronAPI.quitApp) {
        window.electronAPI.quitApp()
      } else {
        console.log('Quit app - Electron API not available')
      }
    }
    
    // 添加切换开发者工具的函数
    const toggleDevTools = () => {
      if (window.electronAPI && window.electronAPI.toggleDevTools) {
        window.electronAPI.toggleDevTools()
      } else {
        console.log('Toggle DevTools - Electron API not available')
      }
    }
    
    // 键盘事件处理函数
    const handleKeyDown = (event) => {
      // 检查是否按下了F12键
      if (event.key === 'F12') {
        event.preventDefault();
        toggleDevTools();
      }
    }
    
    // 组件挂载时添加事件监听器
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    })
    
    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    })
    
    // 暴露方法给子组件使用
    provide('updateStatus', updateStatus)
    
    return {
      statusMessage,
      minimizeWindow,
      maximizeWindow,
      quitApp
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  height: 100vh;
  overflow: hidden;
  -webkit-app-region: no-drag; /* 只有特定区域可以拖动 */
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  background: #1890ff;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  -webkit-app-region: drag; /* 标题栏可拖动 */
  flex-shrink: 0;
}

.header h1 {
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag; /* 标题文本区域可拖动 */
}

.window-controls {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag; /* 控制按钮不可拖动 */
}

.window-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  -webkit-app-region: no-drag; /* 按钮不可拖动 */
}

.window-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.window-btn.close:hover {
  background: #ff4d4f;
}

.nav-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 16px;
  -webkit-app-region: no-drag; /* 导航标签不可拖动 */
  flex-shrink: 0;
}

.nav-tab {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  -webkit-app-region: no-drag; /* 导航标签项不可拖动 */
}

.nav-tab.active {
  border-bottom-color: #1890ff;
  color: #1890ff;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  -webkit-app-region: no-drag; /* 主容器不可拖动 */
}

.status-bar {
  padding: 12px 16px;
  background: #f0f0f0;
  border-top: 1px solid #e8e8e8;
  font-size: 12px;
  color: #666;
  -webkit-app-region: no-drag; /* 状态栏不可拖动 */
  min-height: 40px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.hidden {
  display: none;
}
</style>