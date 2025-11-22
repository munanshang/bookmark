<template>
  <div class="tree-node" :class="[node?.type, { selected: isSelected }]" v-if="node">
    <div class="tree-node-content" @click="selectNode">
      <!-- 展开/折叠图标 -->
      <n-icon 
        v-if="node?.type === 'folder' && node.children && node.children.length > 0"
        class="expand-icon" 
        :class="{ expanded: isExpanded }"
        @click.stop="toggleExpand"
        size="16"
      >
        <CaretDown v-if="isExpanded" />
        <CaretForward v-else />
      </n-icon>
      <span v-else class="expand-placeholder"></span>
      
      <!-- 节点类型图标 -->
      <n-icon class="node-icon" size="16">
        <FolderOpen v-if="node?.type === 'folder' && isExpanded" />
        <Folder v-else-if="node?.type === 'folder'" />
        <Link v-else />
      </n-icon>
      
      <!-- 节点名称 -->
      <span class="node-name">{{ node?.name }}</span>
    </div>
    
    <!-- 子节点 -->
    <div class="tree-children" v-if="shouldExpand && node.children && node.children.length > 0">
      <TreeNode 
        v-for="child in node.children" 
        :key="child.id"
        :node="child"
        :level="(computedLevel || 0) + 1"
        :selected-node="selectedNode"
        @node-selected="$emit('node-selected', $event)"
      />
    </div>
  </div>
  <div v-else>
    <!-- 处理空节点的情况 -->
    <div class="tree-node-content" @click="selectNode">
      <span class="node-name">空节点</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, h } from 'vue'

// 引入NaiveUI图标组件
import { CaretDown, CaretForward, Folder, FolderOpen, Link } from '@vicons/ionicons5'

export default {
  name: 'TreeNode',
  components: {
    CaretDown,
    CaretForward,
    Folder,
    FolderOpen,
    Link
  },
  props: {
    node: {
      type: Object,
      default: null
    },
    level: {
      type: Number,
      default: 0
    },
    selectedNode: {
      type: Object,
      default: null
    }
  },
  emits: ['node-selected'],
  setup(props, { emit }) {
    // 检查节点是否存在
    if (!props.node) {
      console.warn('TreeNode接收到空节点数据');
      return {
        isExpanded: ref(false),
        toggleExpand: () => {},
        selectNode: () => {},
        computedLevel: computed(() => 0),
        shouldExpand: computed(() => false),
        isSelected: computed(() => false)
      };
    }
    
    const isExpanded = ref(true)
    const isSelected = computed(() => {
      return props.selectedNode && props.selectedNode.id === props.node?.id;
    });
    
    // 添加详细的调试信息
    console.log('=== TreeNode Setup ===');
    console.log('接收到的节点数据:', props.node);
    console.log('节点类型:', props.node?.type);
    console.log('节点名称:', props.node?.name);
    console.log('节点ID:', props.node?.id);
    console.log('子节点:', props.node?.children);
    console.log('层级:', props.level);
    
    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
      console.log('切换展开状态:', props.node?.name, isExpanded.value);
    }
    
    const selectNode = () => {
      console.log('选择节点:', props.node);
      console.log('节点类型:', props.node?.type);
      console.log('节点名称:', props.node?.name);
      emit('node-selected', props.node)
    }
    
    // 确保level有默认值
    const computedLevel = computed(() => {
      return props.level || 0;
    });
    
    // 检查是否应该展开
    const shouldExpand = computed(() => {
      const result = isExpanded.value && props.node?.children && props.node.children.length > 0;
      console.log('计算shouldExpand:', {
        nodeName: props.node?.name,
        isExpanded: isExpanded.value,
        hasChildren: !!props.node?.children,
        childrenCount: props.node?.children ? props.node.children.length : 0,
        result: result
      });
      return result;
    });
    
    console.log('TreeNode初始化完成:', props.node?.name);
    
    return {
      isExpanded,
      toggleExpand,
      selectNode,
      computedLevel,
      shouldExpand,
      isSelected
    }
  }
}
</script>

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
  cursor: pointer; /* 确保节点内容有手型光标 */
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