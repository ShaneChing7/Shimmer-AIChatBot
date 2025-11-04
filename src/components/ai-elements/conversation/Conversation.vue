<script setup lang="ts">
import { StickToBottom } from 'vue-stick-to-bottom'
import ConversationScrollButton from './ConversationScrollButton.vue'

interface Props {
  ariaLabel?: string
  class?: string
  initial?: boolean | 'instant' | { damping?: number, stiffness?: number, mass?: number }
  resize?: 'instant' | { damping?: number, stiffness?: number, mass?: number }
  damping?: number
  stiffness?: number
  mass?: number
  anchor?: 'auto' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Conversation',
  initial: true,
  damping: 0.7,
  stiffness: 0.05,
  mass: 1.25,
  anchor: 'none',
})
</script>

<template>
  <StickToBottom
    :aria-label="props.ariaLabel"
    class="conversation-scroll-area relative flex-1"
    :class="[props.class]"
    role="log"
    :initial="props.initial"
    :resize="props.resize"
    :damping="props.damping"
    :stiffness="props.stiffness"
    :mass="props.mass"
    :anchor="props.anchor"
    
  >
    <slot />
    <ConversationScrollButton />
  </StickToBottom>
</template>

<style>/* 滚动条整体 */
.conversation-scroll-area ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* 滚动条滑块（thumb）——默认灰色 */
.conversation-scroll-area ::-webkit-scrollbar-thumb {
  background-color: #e5e5e5;
  border-radius: 5px;
  border: 1px solid transparent;
  background-clip: padding-box;
  transition: background-color 0.25s ease;
}

/* ✅ 当鼠标悬停在滚动条滑块上时变红 */
.conversation-scroll-area ::-webkit-scrollbar-thumb:hover {
  background-color: #dcdcdc;
}

/* 滚动条轨道 */
.conversation-scroll-area ::-webkit-scrollbar-track {
  background: transparent;
}

/* Firefox 降级样式（可选） */
.conversation-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: #e5e5e5 transparent;
}

</style>