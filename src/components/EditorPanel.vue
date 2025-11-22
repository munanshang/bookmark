<template>
  <div class="editor-panel">
    <div class="editor-header">
      <h3>{{ selectedNode ? selectedNode.name : '编辑区域' }}</h3>
      <div class="header-actions">
        <n-button size="small" type="success" @click="addFolder" :disabled="!selectedNode">
          <template #icon>
            <n-icon><Folder /></n-icon>
          </template>
          新建文件夹
        </n-button>
        <n-button size="small" type="info" @click="addBookmark" :disabled="!selectedNode">
          <template #icon>
            <n-icon><Link /></n-icon>
          </template>
          添加书签
        </n-button>
        <n-button size="small" type="error" :disabled="!selectedNode" @click="deleteNode">
          <template #icon>
            <n-icon><Trash /></n-icon>
          </template>
          删除
        </n-button>
      </div>
    </div>
    <div class="editor-content">
      <div class="empty-state" v-if="!selectedNode">
        <n-empty description="请从左侧选择一个书签或文件夹进行编辑">
          <template #icon>
            <n-icon size="48">
              <HandLeft />
            </n-icon>
          </template>
        </n-empty>
      </div>
      <div v-else>
        <!-- 编辑表单 -->
        <n-form label-placement="left" label-width="80">
          <n-form-item label="名称">
            <n-input v-model:value="nodeName" />
          </n-form-item>
          
          <n-form-item v-if="selectedNode.type === 'bookmark'" label="URL">
            <n-input v-model:value="nodeUrl" />
          </n-form-item>
          
          <n-form-item v-if="selectedNode.type === 'bookmark'" label="标签">
            <n-dynamic-tags v-model:value="nodeTags" />
          </n-form-item>
          
          <n-form-item>
            <n-button type="primary" @click="saveNode">
              <template #icon>
                <n-icon><Save /></n-icon>
              </template>
              保存修改
            </n-button>
          </n-form-item>
        </n-form>
        
        <!-- 如果是文件夹，显示子书签 -->
        <div v-if="selectedNode && selectedNode.type === 'folder' && selectedNode.children && selectedNode.children.length > 0">
          <n-divider title-placement="left">子节点</n-divider>
          <n-data-table
            :columns="columns"
            :data="selectedNode.children"
            :pagination="false"
            size="small"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, h } from 'vue'

// 引入NaiveUI图标组件
import { Folder, Link, Trash, Save, HandLeft } from '@vicons/ionicons5'

export default {
  name: 'EditorPanel',
  components: {
    Folder,
    Link,
    Trash,
    Save,
    HandLeft
  },
  props: {
    selectedNode: {
      type: Object,
      default: null
    }
  },
  emits: ['add-folder', 'add-bookmark', 'delete-node', 'save-node', 'select-node'],
  setup(props, { emit }) {
    // 监视selectedNode变化
    watch(() => props.selectedNode, (newVal) => {
      console.log('=== EditorPanel selectedNode变化 ===')
      console.log('新值:', newVal)
      if (newVal) {
        console.log('节点类型:', newVal.type)
        console.log('节点名称:', newVal.name)
        console.log('子节点数量:', newVal.children ? newVal.children.length : 0)
      }
    }, { deep: true })
    
    // 计算属性：节点名称
    const nodeName = computed({
      get() {
        return props.selectedNode ? props.selectedNode.name : ''
      },
      set(value) {
        if (props.selectedNode) {
          props.selectedNode.name = value
        }
      }
    })
    
    // 计算属性：节点URL
    const nodeUrl = computed({
      get() {
        return props.selectedNode && props.selectedNode.type === 'bookmark' ? props.selectedNode.url : ''
      },
      set(value) {
        if (props.selectedNode && props.selectedNode.type === 'bookmark') {
          props.selectedNode.url = value
        }
      }
    })
    
    // 计算属性：节点标签
    const nodeTags = computed({
      get() {
        return props.selectedNode && props.selectedNode.tags ? props.selectedNode.tags : []
      },
      set(value) {
        if (props.selectedNode) {
          props.selectedNode.tags = value
        }
      }
    })
    
    const addFolder = () => {
      console.log('EditorPanel: 添加文件夹')
      emit('add-folder')
    }
    
    const addBookmark = () => {
      console.log('EditorPanel: 添加书签')
      emit('add-bookmark')
    }
    
    const deleteNode = () => {
      if (props.selectedNode && confirm(`确定要删除"${props.selectedNode.name}"吗？`)) {
        console.log('EditorPanel: 删除节点', props.selectedNode.name)
        emit('delete-node')
      }
    }
    
    const saveNode = () => {
      console.log('EditorPanel: 保存节点', props.selectedNode?.name)
      emit('save-node')
    }
    
    const selectNode = (node) => {
      console.log('EditorPanel: 选择子节点', node.name)
      emit('select-node', node)
    }
    
    // 表格列定义
    const columns = [
      {
        title: '名称',
        key: 'name'
      },
      {
        title: '类型',
        key: 'type',
        render(row) {
          return row.type === 'folder' ? '文件夹' : '书签'
        }
      },
      {
        title: 'URL',
        key: 'url',
        render(row) {
          if (row.type === 'bookmark') {
            return h('a', { href: row.url, target: '_blank' }, row.url)
          }
          return '-'
        }
      },
      {
        title: '操作',
        key: 'actions',
        render(row) {
          return h(
            'n-button',
            {
              size: 'small',
              type: 'info',
              onClick: () => selectNode(row),
              style: {
                cursor: 'pointer'
              }
            },
            '编辑'
          )
        }
      }
    ]
    
    return {
      nodeName,
      nodeUrl,
      nodeTags,
      columns,
      addFolder,
      addBookmark,
      deleteNode,
      saveNode,
      selectNode
    }
  }
}
</script>

<style scoped>
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

.header-actions {
  display: flex;
  gap: 8px; /* 添加按钮间距 */
}

.header-actions :deep(.n-button) {
  cursor: pointer; /* 确保按钮有手型光标 */
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

.empty-state :deep(.n-button) {
  cursor: pointer; /* 确保空状态中的按钮有手型光标 */
}

/* 表格操作列按钮样式 */
:deep(.n-data-table .n-button) {
  cursor: pointer; /* 确保表格中的按钮有手型光标 */
}
</style>