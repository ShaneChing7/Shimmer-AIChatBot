<template>
  <!-- chat-view -->
  <div class=" h-screen flex bg-background">
    <!-- sidebar -->
     <div class="flex-none">
      <Sidebar></Sidebar>
     </div>
    <!-- Main Chat Area -->
    <div class="flex-1 flex h-full flex-col min-w-0 overflow-y-hidden ">
      <!-- ChatArea -->
      
        <ChatArea class="flex-1"></ChatArea>
       
        <!-- <ChatInput class="flex-none" ></ChatInput> -->
      
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import ChatArea from '@/components/ChatArea.vue';
import ChatInput from '@/components/ChatInput.vue';
import MessageList from '@/components/MessageList.vue';
// 导入其他可能需要的组件，例如 Session 和 MessageItem，它们会在 MessageList 内部使用


</script>

<style scoped>

</style>