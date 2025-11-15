<template>
  <div class="border-t border-border p-2 flex-none h-16">
    <div class="flex items-end space-x-3">
      <textarea
        v-model="message"
        @keydown.enter.prevent="handleSend"
        rows="1"
        placeholder="输入您的消息..."
        class="flex-1 resize-none border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
        style="max-height: 150px; overflow-y: auto;"
      ></textarea>

      <button
        @click="sendMessage"
        :disabled="!message.trim()"
        class="bg-blue-500 text-white font-semibold py-3 px-5 rounded-lg shadow-md hover:bg-blue-600 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 使用 ref 创建一个响应式变量来存储用户输入的消息
const message = ref('');

/**
 * @description 处理消息发送的逻辑
 */
const sendMessage = () => {
  const content = message.value.trim();

  // 1. 检查消息是否为空
  if (content === '') {
    return;
  }

  // 2. 在实际应用中，您会在这里执行以下操作：
  //    - 将 content 发送到父组件 (例如通过 $emit 或 defineEmits)
  //    - 调用 API 发送消息到后端
  
  console.log('发送消息:', content); 

  // 3. 清空输入框
  message.value = '';
};


/**
 * @description 监听 Enter 键，执行发送操作
 * @param event 键盘事件
 */
const handleSend = (event: KeyboardEvent) => {
    // 按下 Enter 键，如果同时按下了 Shift 键，则换行，否则发送
    if (event.shiftKey) {
        // 按 Shift + Enter 时，让浏览器默认行为 (换行) 生效
        return; 
    }
    // 仅按 Enter 键时，发送消息
    sendMessage();
}

// 如果您需要将消息内容传递给父组件，可以添加以下代码：
// const emit = defineEmits(['send-message']);

/* // 修改 sendMessage 函数为：
const sendMessage = () => {
  const content = message.value.trim();
  if (content === '') return;
  
  // 向父组件发送消息内容
  // emit('send-message', content); 

  console.log('发送消息:', content);
  message.value = '';
};
*/
</script>

<style scoped>
/* 可以在这里添加或调整样式，例如调整 textarea 边框等 */
/* 对于 Vue 组件，通常使用 Tailwind CSS 类（如示例中所示）来实现大部分样式 */
</style>