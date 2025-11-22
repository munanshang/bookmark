<template>
  <div class="tree-panel">
    <!-- 顶部操作区域 -->
    <div class="tree-header">
      <div class="header-actions">
        <n-button size="small" type="primary" @click="refreshBookmarks">
          <template #icon>
            <n-icon><Refresh /></n-icon>
          </template>
          刷新
        </n-button>
        <n-button size="small" @click="saveBookmarks">
          <template #icon>
            <n-icon><Save /></n-icon>
          </template>
          保存
        </n-button>
      </div>
      
      <!-- 搜索区域 -->
      <div class="search-container">
        <n-input 
          placeholder="搜索书签..." 
          v-model:value="searchQuery"
          @input="onSearch"
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>
      </div>
    </div>
    
    <!-- 树形结构显示区域 -->
    <div class="tree-content">
      <!-- 渲染书签树 -->
      <div v-if="bookmarksData && bookmarksData.roots">
        <div v-for="(root, rootKey) in bookmarksData.roots" :key="rootKey">
          <TreeNode 
            :node="root" 
            :level="0" 
            :selected-node="selectedNode"
            @node-selected="onNodeSelected"
          />
        </div>
      </div>
      <div v-else-if="bookmarksData === null">
        <n-spin size="small">
          <template #description>正在加载书签数据...</template>
        </n-spin>
      </div>
      <div v-else>
        <n-empty description="暂无书签数据" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import TreeNode from './TreeNode.vue'

// 引入NaiveUI图标组件
import { Refresh, Save, Search } from '@vicons/ionicons5'

export default {
  name: 'BookmarkTree',
  components: {
    TreeNode,
    Refresh,
    Save,
    Search
  },
  props: {
    bookmarksData: {
      type: Object,
      default: null
    },
    selectedNode: {
      type: Object,
      default: null
    }
  },
  emits: ['node-selected', 'refresh', 'save', 'search'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    
    // 监视props.bookmarksData变化
    watch(() => props.bookmarksData, (newVal) => {
      console.log('=== BookmarkTree bookmarksData变化 ===')
      console.log('新值:', newVal)
    }, { deep: true })
    
    const onNodeSelected = (node) => {
      console.log('BookmarkTree: 节点被选中', node)
      emit('node-selected', node)
    }
    
    const refreshBookmarks = () => {
      console.log('BookmarkTree: 刷新书签')
      emit('refresh')
    }
    
    const saveBookmarks = () => {
      console.log('BookmarkTree: 保存书签')
      emit('save')
    }
    
    const onSearch = () => {
      console.log('BookmarkTree: 搜索', searchQuery.value)
      emit('search', searchQuery.value)
    }
    
    return {
      searchQuery,
      onNodeSelected,
      refreshBookmarks,
      saveBookmarks,
      onSearch
    }
  }
}
</script>

<style scoped>
.tree-panel {
  width: 250px;
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  -webkit-app-region: no-drag; /* 树形面板不可拖动 */
}

.tree-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #f5f5f5;
  -webkit-app-region: no-drag; /* 树形头部不可拖动 */
}

.header-actions {
  display: flex;
  gap: 8px; /* 添加按钮间距 */
}

.header-actions :deep(.n-button) {
  cursor: pointer; /* 确保按钮有手型光标 */
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
  visibility: visible;
  overflow: visible;
  -webkit-app-region: no-drag; /* 树形内容区域不可拖动 */
  margin: 8px;
}
</style>