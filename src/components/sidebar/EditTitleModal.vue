<template>
  <Dialog :open="props.open" @update:open="$emit('update:open', $event)">
    
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>修改会话标题</DialogTitle>
        <DialogDescription>
          请输入新的会话标题，点击保存修改。
        </DialogDescription>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-0">
          <Label for="title-input" class="text-right">
            新标题
          </Label>
          <Input id="title-input" v-model="titleValue" class="col-span-3 focus:ring-1" @keyup.enter="saveTitle" />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" @click="saveTitle">
          保存修改
        </Button>
      </DialogFooter>
      
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { ref, defineProps,watch } from "vue";
import { useChatStore } from "@/store/modules/chat";
import type { ChatSession } from "@/api/chat/type";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
const chatStore = useChatStore();

const props = defineProps<{
  session: ChatSession;
  open: boolean; // 接收可见性状态
}>();

const emit = defineEmits(['update:open']);

const titleValue = ref(props.session.title);

watch(() => props.open, (newValue) => {
  // 当模态框变为可见时
  if (newValue) {
    // 从 props 重新同步最新的标题到输入框
    titleValue.value = props.session.title;
  }
});


// 保存修改
const saveTitle = async () => {
  if (!titleValue.value.trim()) return;
  await chatStore.updateSessionTitle(props.session.id, titleValue.value);
  emit('update:open', false);
};
</script>

