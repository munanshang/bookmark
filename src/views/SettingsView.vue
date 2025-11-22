<template>
  <div class="main-container">
    <div class="settings-page">
      <n-page-header>
        <template #title>
          <n-icon size="24"><Settings /></n-icon>
          <span>设置</span>
        </template>
      </n-page-header>
      
      <n-card>
        <n-form label-placement="left" label-width="120">
          <n-form-item label="GitHub用户名">
            <n-input v-model:value="config.username" placeholder="例如: munanshang" />
          </n-form-item>
          
          <n-form-item label="仓库名">
            <n-input v-model:value="config.repo" placeholder="例如: bookmark" />
          </n-form-item>
          
          <n-form-item label="文件路径">
            <n-input v-model:value="config.filePath" placeholder="例如: bookmarks.json (默认)" />
          </n-form-item>
          
          <n-form-item v-show="showTokenInput" label="访问Token">
            <n-input v-model:value="config.token" type="password" placeholder="GitHub Personal Access Token" />
          </n-form-item>
          
          <!-- 添加加速功能开关 -->
          <n-form-item label="镜像加速">
            <n-switch v-model:value="config.useMirror">
              <template #checked>
                已启用 (通过 hub.gitmirror.com 访问GitHub)
              </template>
              <template #unchecked>
                已禁用
              </template>
            </n-switch>
          </n-form-item>
          
          <n-form-item>
            <n-space>
              <n-button @click="toggleTokenInput">
                {{ showTokenInput ? '隐藏Token' : '需要Token?' }}
              </n-button>
              <n-button type="primary" @click="saveSettings">
                <template #icon>
                  <n-icon><Save /></n-icon>
                </template>
                保存设置
              </n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </n-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, inject } from 'vue'

// 引入NaiveUI图标组件
import { Settings, Save } from '@vicons/ionicons5'

export default {
  name: 'SettingsView',
  components: {
    Settings,
    Save
  },
  setup() {
    const updateStatus = inject('updateStatus', (message) => console.log(message))
    const config = reactive({
      username: '',
      repo: '',
      filePath: 'bookmarks.json',
      token: '',
      useMirror: false  // 添加加速功能开关，默认关闭
    })
    
    const showTokenInput = ref(false)
    
    const toggleTokenInput = () => {
      showTokenInput.value = !showTokenInput.value
    }
    
    const saveSettings = async () => {
      try {
        updateStatus('正在保存设置...')
        if (window.electronAPI && window.electronAPI.saveConfig) {
          // 创建一个普通对象来避免"An object could not be cloned"错误
          const configToSave = {
            username: config.username,
            repo: config.repo,
            filePath: config.filePath,
            token: config.token,
            useMirror: config.useMirror  // 保存加速功能开关状态
          }
          
          const result = await window.electronAPI.saveConfig(configToSave)
          if (result.success) {
            updateStatus('设置已保存')
            console.log('设置已保存')
          } else {
            updateStatus('保存设置失败: ' + result.error)
            console.error('保存设置失败:', result.error)
          }
        } else {
          updateStatus('Electron API不可用，无法保存设置')
          console.error('Electron API不可用，无法保存设置')
        }
      } catch (error) {
        updateStatus('保存设置失败: ' + error.message)
        console.error('保存设置失败:', error)
      }
    }
    
    const loadSettings = async () => {
      try {
        updateStatus('正在加载设置...')
        if (window.electronAPI && window.electronAPI.getConfig) {
          const savedConfig = await window.electronAPI.getConfig()
          Object.assign(config, savedConfig)
          updateStatus('设置已加载')
        } else {
          updateStatus('Electron API不可用，无法加载设置')
        }
      } catch (error) {
        updateStatus('加载设置失败: ' + error.message)
        console.error('加载设置失败:', error)
      }
    }
    
    // 组件挂载时加载设置
    onMounted(() => {
      loadSettings()
    })
    
    return {
      config,
      showTokenInput,
      toggleTokenInput,
      saveSettings
    }
  }
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: #f5f5f5;
  -webkit-app-region: no-drag; /* 主容器不可拖动 */
}

.settings-page {
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  -webkit-app-region: no-drag; /* 设置页面不可拖动 */
}

.settings-page h2 {
  margin-bottom: 24px;
  color: #333;
  -webkit-app-region: no-drag; /* 标题不可拖动 */
}
</style>