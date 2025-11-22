<template>
  <div class="main-view">
    <div class="content">
      <BookmarkTree 
        :bookmarks-data="bookmarksData"
        :selected-node="selectedNode"
        @node-selected="onNodeSelected"
        @refresh="refreshBookmarks"
        @save="saveBookmarks"
        @search="onSearch"
      />
      
      <EditorPanel 
        :selected-node="selectedNode"
        @add-folder="addFolder"
        @add-bookmark="addBookmark"
        @delete-node="deleteNode"
        @save-node="saveNode"
        @select-node="selectNode"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import BookmarkTree from '../components/BookmarkTree.vue'
import EditorPanel from '../components/EditorPanel.vue'

export default {
  name: 'MainView',
  components: {
    BookmarkTree,
    EditorPanel
  },
  setup() {
    const router = useRouter()
    const bookmarksData = ref(null)
    const selectedNode = ref(null)
    const searchQuery = ref('')
    const updateStatus = inject('updateStatus', (message) => console.log(message))
    
    // 添加调试信息
    watch(bookmarksData, (newVal) => {
      console.log('=== MainView bookmarksData变化 ===');
      console.log('新值:', newVal);
      console.log('类型:', typeof newVal);
      console.log('是否为对象:', newVal instanceof Object);
      
      if (newVal && newVal.roots) {
        console.log('roots对象存在');
        console.log('roots键:', Object.keys(newVal.roots));
        
        // 遍历根节点
        for (const key in newVal.roots) {
          const root = newVal.roots[key];
          console.log(`根节点[${key}]:`, root);
          console.log(`根节点[${key}]名称:`, root.name);
          console.log(`根节点[${key}]类型:`, root.type);
          console.log(`根节点[${key}]子节点数量:`, root.children ? root.children.length : 0);
          
          // 遍历子节点
          if (root.children && root.children.length > 0) {
            root.children.forEach((child, index) => {
              console.log(`  子节点[${index}]:`, child.name, `(${child.type})`);
            });
          }
        }
      } else {
        console.log('bookmarksData.roots不存在或为空');
      }
      
      // 强制触发DOM更新
      nextTick(() => {
        console.log('DOM更新完成');
      });
    }, { deep: true, immediate: true }); // 添加immediate选项
    
    // 监视selectedNode变化
    watch(selectedNode, (newVal) => {
      console.log('=== MainView selectedNode变化 ===');
      console.log('新值:', newVal);
      console.log('节点类型:', newVal?.type);
      console.log('节点名称:', newVal?.name);
      console.log('是否有子节点:', !!newVal?.children);
      console.log('子节点数量:', newVal?.children?.length || 0);
    }, { deep: true });
    
    // 添加一个计算属性来确保数据正确显示
    const displayBookmarksData = computed(() => {
      console.log('计算displayBookmarksData:', bookmarksData.value);
      return bookmarksData.value;
    });
    
    // 添加一个额外的watcher来跟踪displayBookmarksData
    watch(displayBookmarksData, (newVal) => {
      console.log('=== displayBookmarksData变化 ===');
      console.log('新值:', newVal);
    });
    
    const saveBookmarks = () => {
      // 保存书签逻辑
      console.log('MainView: 保存书签')
      updateStatus('保存书签到本地...')
      
      // 调用Electron API保存书签
      if (window.electronAPI && window.electronAPI.saveBookmarks) {
        window.electronAPI.saveBookmarks(bookmarksData.value)
          .then(result => {
            if (result.success) {
              updateStatus('书签已保存到: ' + result.filePath)
            } else {
              updateStatus('保存失败: ' + result.error)
            }
          })
          .catch(error => {
            updateStatus('保存失败: ' + error.message)
          })
      } else {
        updateStatus('Electron API不可用，无法保存书签')
      }
    }
    
    const refreshBookmarks = async () => {
      // 刷新书签逻辑
      console.log('MainView: 刷新书签')
      updateStatus('正在刷新书签...')
      
      try {
        // 首先获取配置信息
        if (window.electronAPI && window.electronAPI.getConfig) {
          const config = await window.electronAPI.getConfig()
          
          // 检查配置是否完整
          if (!config.username || !config.repo) {
            updateStatus('请先在设置页面配置GitHub信息')
            return
          }
          
          // 构造GitHub原始文件URL
          const filePath = config.filePath || 'bookmarks.json'
          let rawUrl = `https://raw.githubusercontent.com/${config.username}/${config.repo}/main/${filePath}`
          
          // 如果启用了镜像加速，则使用hub.gitmirror.com
          if (config.useMirror) {
            rawUrl = `https://hub.gitmirror.com/https://raw.githubusercontent.com/${config.username}/${config.repo}/main/${filePath}`
            console.log('使用镜像加速URL:', rawUrl)
          }
          
          // 在控制台输出调试信息
          console.log('构造的URL:', rawUrl)
          console.log('配置信息:', config)
          console.log('用户名:', config.username)
          console.log('仓库名:', config.repo)
          console.log('文件路径:', filePath)
          console.log('使用镜像加速:', config.useMirror || false)
          
          // 验证URL格式
          try {
            new URL(rawUrl);
            console.log('URL格式有效');
          } catch (urlError) {
            console.error('URL格式无效:', urlError);
            updateStatus('URL格式无效: ' + urlError.message)
            return;
          }
          
          updateStatus(`正在从 ${rawUrl} 加载书签...`)
          
          // 调用Electron API刷新书签（通过主进程处理网络请求）
          if (window.electronAPI && window.electronAPI.readBookmarks) {
            const result = await window.electronAPI.readBookmarks(rawUrl)
            console.log('网络请求结果:', result)
            
            if (result.success) {
              console.log('=== 书签数据加载成功 ===');
              console.log('原始数据:', result.data);
              console.log('数据类型:', typeof result.data);
              console.log('是否为对象:', result.data instanceof Object);
              
              if (result.data && result.data.roots) {
                console.log('roots对象存在');
                console.log('roots键:', Object.keys(result.data.roots));
                
                // 详细检查每个根节点
                for (const key in result.data.roots) {
                  const root = result.data.roots[key];
                  console.log(`根节点[${key}]:`, root);
                  console.log(`根节点[${key}]名称:`, root.name);
                  console.log(`根节点[${key}]类型:`, root.type);
                  console.log(`根节点[${key}]子节点数量:`, root.children ? root.children.length : 0);
                }
              }
              
              bookmarksData.value = result.data
              updateStatus('书签数据加载成功')
            } else {
              console.error('加载书签失败:', result.error)
              updateStatus('加载失败: ' + result.error)
            }
          } else {
            updateStatus('Electron API不可用')
          }
        }
      } catch (error) {
        console.error('刷新书签时发生错误:', error)
        updateStatus('刷新失败: ' + error.message)
      }
    }
    
    const addFolder = () => {
      console.log('MainView: 添加文件夹')
      updateStatus('添加文件夹')
    }
    
    const addBookmark = () => {
      console.log('MainView: 添加书签')
      updateStatus('添加书签')
    }
    
    const onNodeSelected = (node) => {
      console.log('=== MainView 节点选择事件 ===');
      console.log('选中的节点:', node);
      console.log('节点类型:', node?.type);
      console.log('节点名称:', node?.name);
      console.log('节点子节点:', node?.children);
      selectedNode.value = node;
      console.log('selectedNode已更新:', selectedNode.value);
    }
    
    const selectNode = (node) => {
      console.log('=== MainView selectNode方法调用 ===');
      console.log('选中的节点:', node);
      console.log('节点类型:', node?.type);
      console.log('节点名称:', node?.name);
      selectedNode.value = node;
      console.log('selectedNode已更新:', selectedNode.value);
    }
    
    const saveNode = () => {
      updateStatus('节点已保存')
    }
    
    const deleteNode = () => {
      if (selectedNode.value && confirm(`确定要删除"${selectedNode.value.name}"吗？`)) {
        updateStatus('节点已删除')
        selectedNode.value = null
      }
    }
    
    const onSearch = (query) => {
      searchQuery.value = query
      console.log('MainView: 搜索查询:', query)
      // 这里可以添加搜索逻辑
    }
    
    // 添加从本地文件加载书签的函数
    const loadLocalBookmarks = async () => {
      try {
        console.log('尝试从本地加载书签文件...');
        
        // 通过IPC从主进程读取本地文件
        const result = await window.electronAPI.invoke('load-local-bookmarks');
        
        console.log('本地文件读取结果:', result);
        
        if (result.success) {
          console.log('本地书签数据加载成功:', result.data);
          bookmarksData.value = result.data;
          console.log('bookmarksData已设置:', bookmarksData.value);
          // 强制触发更新
          await nextTick();
          console.log('更新后的bookmarksData:', bookmarksData.value);
          updateStatus('本地书签数据加载成功');
        } else {
          console.error('本地书签数据加载失败:', result.error);
          updateStatus('本地书签数据加载失败: ' + result.error);
        }
      } catch (error) {
        console.error('加载本地书签时发生错误:', error);
        updateStatus('加载本地书签时发生错误: ' + error.message);
      }
    };
    
    // 修改mounted钩子，添加本地测试选项
    onMounted(async () => {
      console.log('MainView mounted');
      
      // 检查是否有本地测试参数
      const urlParams = new URLSearchParams(window.location.search);
      const useLocal = urlParams.get('local') === 'true';
      
      console.log('是否使用本地测试:', useLocal);
      
      if (useLocal) {
        console.log('使用本地书签文件进行测试');
        await loadLocalBookmarks();
      } else {
        // 原有的初始化逻辑
        try {
          const configResult = await window.electronAPI.invoke('get-config');
          console.log('配置获取结果:', configResult);
          if (configResult.username && configResult.repo) {
            await refreshBookmarks();
          } else {
            console.log('配置不完整，跳转到设置页面');
            router.push('/settings');
          }
        } catch (error) {
          console.error('初始化时发生错误:', error);
          router.push('/settings');
        }
      }
    });
    
    // 计算属性：标签字符串
    const tagsString = computed({
      get() {
        if (selectedNode.value && selectedNode.value.tags) {
          return selectedNode.value.tags.join(', ')
        }
        return ''
      },
      set(value) {
        if (selectedNode.value) {
          selectedNode.value.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
        }
      }
    })
    
    return {
      bookmarksData,
      selectedNode,
      searchQuery,
      tagsString,
      saveBookmarks,
      refreshBookmarks,
      addFolder,
      addBookmark,
      onNodeSelected,
      selectNode,
      saveNode,
      deleteNode,
      loadLocalBookmarks,
      onSearch
    }
  }
}
</script>

<style scoped>
.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;
  -webkit-app-region: no-drag; /* 主视图不可拖动 */
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 允许内容区域收缩 */
  -webkit-app-region: no-drag; /* 内容区域不可拖动 */
}

.tree-panel {
  width: 250px;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  min-height: 400px; /* 确保面板有最小高度 */
  -webkit-app-region: no-drag; /* 树形面板不可拖动 */
}

.tree-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #f5f5f5;
  -webkit-app-region: no-drag; /* 树形头部不可拖动 */
}

.search-container {
  margin-top: 12px;
  -webkit-app-region: no-drag; /* 搜索容器不可拖动 */
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 300px;
  background-color: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  color: #333;
  position: relative;
  /* 确保内容可见 */
  visibility: visible;
  /* 确保内容不被裁剪 */
  overflow: visible;
  -webkit-app-region: no-drag; /* 确保树形内容区域不可拖拽 */
  margin: 8px;
}

.tree-footer {
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
  background-color: #f5f5f5;
  -webkit-app-region: no-drag; /* 树形底部不可拖动 */
}

.editor-panel {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-app-region: no-drag; /* 编辑面板不可拖动 */
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: no-drag; /* 编辑头部不可拖动 */
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  -webkit-app-region: no-drag; /* 编辑内容不可拖动 */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  -webkit-app-region: no-drag; /* 空状态不可拖动 */
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.bookmark-list {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  -webkit-app-region: no-drag; /* 书签列表不可拖动 */
}

.bookmark-list th,
.bookmark-list td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
  -webkit-app-region: no-drag; /* 表格单元格不可拖动 */
}

.bookmark-list th {
  background: #fafafa;
  font-weight: 500;
}

.debug-info {
  color: #ff6b6b;
  font-size: 12px;
  margin: 2px 0;
  padding: 2px 4px;
  background-color: #fff0f0;
  border-radius: 3px;
}

/* 标题区域按钮组 */
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  -webkit-app-region: no-drag; /* 按钮组不可拖动 */
}

.header-actions .btn {
  margin: 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag; /* 按钮不可拖动 */
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.btn-info {
  background: #1890ff;
  color: white;
}

.btn-info:hover {
  background: #40a9ff;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.btn-default {
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
  border: 1px solid #d9d9d9;
}

.btn-default:hover {
  background: #f5f5f5;
  border-color: #40a9ff;
}

/* 搜索框样式 */
.search-input {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  -webkit-app-region: no-drag; /* 搜索输入框不可拖动 */
}

.search-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-group {
  margin-bottom: 16px;
  -webkit-app-region: no-drag; /* 表单组不可拖动 */
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
  -webkit-app-region: no-drag; /* 标签不可拖动 */
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  -webkit-app-region: no-drag; /* 输入框不可拖动 */
}

.form-group input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  -webkit-app-region: no-drag; /* 按钮组不可拖动 */
}
</style>

<style scoped>
.tree-node {
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
  -webkit-app-region: no-drag; /* 树节点不可拖动 */
}

.tree-node-content {
  padding: 6px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  background-color: transparent;
  transition: background-color 0.2s;
  -webkit-app-region: no-drag; /* 节点内容不可拖动 */
}

.tree-node-content:hover {
  background-color: #f0f0f0;
}

.tree-node.selected > .tree-node-content {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.tree-children {
  margin-left: 20px;
  border-left: 1px dashed #d9d9d9;
  padding-left: 10px;
  -webkit-app-region: no-drag; /* 子节点区域不可拖动 */
}

.tree-node.folder > .tree-node-content {
  font-weight: 500;
}

.tree-node.bookmark > .tree-node-content {
  font-weight: normal;
}

.tree-node .tree-node-content .node-icon {
  width: 16px;
  text-align: center;
  color: #555;
  -webkit-app-region: no-drag; /* 节点图标不可拖动 */
}

.tree-node .tree-node-content .node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  -webkit-app-region: no-drag; /* 节点名称不可拖动 */
}

.tree-node .expand-icon {
  width: 16px;
  text-align: center;
  cursor: pointer;
  color: #888;
  transition: transform 0.2s;
  -webkit-app-region: no-drag; /* 展开图标不可拖动 */
}

.tree-node .expand-icon.expanded {
  transform: rotate(90deg);
}

.tree-node .expand-placeholder {
  width: 16px;
  -webkit-app-region: no-drag; /* 展开占位符不可拖动 */
}
</style>