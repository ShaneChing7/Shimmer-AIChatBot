<template>
  <div class="flex justify-items-end px-0 py-5">
    <div class="hover:bg-gray-400 border-none rounded-full text-xl leading-none w-9 h-9 flex justify-center items-center py-1.5 px-2.5" @click="toggleCollapse">
        <Menu class="" ></Menu> </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { Menu } from 'lucide-vue-next';

const emit = defineEmits(['toggle-sidebar']);

const isCollapsed = ref(true);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('toggle-sidebar', isCollapsed.value);
};
</script>

<style scoped>
.collapse-btn {
  background: #ccc;
  border: none;
  padding: 5px 10px;
  border-radius: 50%;
  font-size: 1.2em;
  line-height: 1;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.collapse-btn:hover {
  background: #aaa;
}
</style>