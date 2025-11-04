<template>
  <div class=" overflow-x-hidden flex flex-col h-full overflow-y-hidden">
      <Conversation>
        <ConversationContent>
          <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
        </ConversationContent>
        <ConversationScrollButton/>
      </Conversation>
  </div>
</template>

<script setup>
import { ref, defineProps, nextTick, watch } from 'vue';
import MessageItem from './MessageItem.vue';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
});

</script>

<style scoped>
/* 确保 message-list 容器有明确的高度，否则 el-scrollbar 无法计算高度 */
.message-list {
  /* 假设它被放置在一个 flex-1 的父容器中，或者像 ChatArea 中一样 */
  height: 100%; 
}
</style>
