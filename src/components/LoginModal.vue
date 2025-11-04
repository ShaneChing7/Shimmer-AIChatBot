<template>
  <div v-if="visible" class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
    @click="closeModal"></div>

  <transition name="fade-scale">
    <div v-if="visible" class="fixed flex flex-col bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 top-1/2 left-1/2 z-50 
             w-[90%] max-w-sm sm:max-w-md max-h-[600px] 
             rounded-xl -translate-x-1/2 -translate-y-1/2 shadow-2xl p-6 transition-all duration-300 ease-out">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-black">
          {{ isLoginMode ? '账号登录' : '注册新账号' }}
        </h2>
        <div class="p-1 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="closeModal">
          <X :size="20"></X>
        </div>
      </div>

      <div class="space-y-4">

        <div class="flex flex-col">
          <label for="username" class="text-sm font-medium mb-1">用户名</label>
          <div class="border rounded-lg ">
            <input id="username" v-model="formData.username" type="text" placeholder="请输入用户名 (3-20个字符)" class="w-full px-4 py-2.5 
         border rounded-lg 
         bg-gray-50 dark:bg-gray-700 
         border-gray-300 dark:border-gray-600 
         focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 
         transition-all duration-200;" :class="{ 'border-red-500 ring-red-500': errors.username }" />
          </div>

          <p v-if="errors.username" class="text-xs text-red-500 mt-1">{{ errors.username }}</p>
        </div>

        <div class="flex flex-col">
          <label for="password" class="text-sm font-medium mb-1">密码</label>
          <div class="border rounded-lg ">
            <input id="password" v-model="formData.password" type="password" placeholder="请输入密码 (至少6位)" class="w-full px-4 py-2.5 
         border rounded-lg 
         bg-gray-50 dark:bg-gray-700 
         border-gray-300 dark:border-gray-600 
         focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 
         transition-all duration-200;" :class="{ 'border-red-500 ring-red-500': errors.password }" />
          </div>

          <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
        </div>

        <div v-if="!isLoginMode" class="flex flex-col">
          <label for="confirmPassword" class="text-sm font-medium mb-1">确认密码</label>
          <div class="border rounded-lg">
            <input id="confirmPassword" v-model="formData.password2" type="password" placeholder="请再次输入密码"
            class="w-full px-4 py-2.5 
         border rounded-lg 
         bg-gray-50 dark:bg-gray-700 
         border-gray-300 dark:border-gray-600 
         focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 
         transition-all duration-200;" :class="{ 'border-red-500 ring-red-500': errors.confirmPassword }" />
          </div>
          
          <p v-if="errors.confirmPassword" class="text-xs text-red-500 mt-1">{{ errors.confirmPassword }}</p>
        </div>

      </div>

      <div class="mt-6 flex flex-col items-center">
        <div @click="handleSubmit" :disabled="isLoading" class="flex justify-center w-full py-2.5 rounded-lg font-semibold transition-colors duration-200 
                 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 
                 disabled:bg-gray-400 disabled:cursor-not-allowed">
          <span v-if="isLoading" class="flex items-center justify-center">
            <Loader2 :size="20" class="animate-spin mr-2" />
            处理中...
          </span>
          <span v-else>{{ isLoginMode ? '立即登录' : '立即注册' }}</span>
        </div>

        <div class="mt-4 text-sm text-center">
          <span class="text-gray-500 dark:text-gray-400">
            {{ isLoginMode ? '还没有账号？' : '已有账号？' }}
          </span>
          <button type="button" @click="toggleMode"
            class=" cursor-pointer ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            {{ isLoginMode ? '去注册' : '去登录' }}
          </button>
        </div>
      </div>

    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import type { LoginFormData, RegisterFormData } from '@/api/user/type';
// 假设您已经引入了您的用户 Store
import useUserStore from '@/store/modules/user'; 
import { useChatStore } from '@/store/modules/chat';
// 引入 vue-sonner 的 toast 函数
import { toast } from 'vue-sonner';

const userStore = useUserStore();
const chatStore = useChatStore()
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

// 状态管理
const isLoginMode = ref(true); // true: 登录, false: 注册
const isLoading = ref(false); // 提交加载状态

const formData = reactive<RegisterFormData>({
  username: '',
  password: '',
  password2: '',
});

const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

// 模态框关闭函数
const closeModal = () => {
  emit('update:visible', false);
};

// 模式切换函数
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
};

// 校验函数
const validateForm = (): boolean => {
  // 清空之前的错误
  errors.username = '';
  errors.password = '';
  errors.confirmPassword = '';

  let isValid = true;

  // 1. 用户名校验
  if (formData.username.length < 3 || formData.username.length > 20) {
    errors.username = '用户名长度需在 3 到 20 个字符之间';
    isValid = false;
  }

  // 2. 密码校验
  if (formData.password.length < 6) {
    errors.password = '密码长度不能少于 6 位';
    isValid = false;
  }

  // 3. 确认密码校验 (仅在注册模式下)
  if (!isLoginMode.value) {
    if (formData.password2 === '') {
      errors.confirmPassword = '请再次输入密码';
      isValid = false;
    } else if (formData.password2 !== formData.password) {
      errors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }
  }

  return isValid;
};

// 重置表单和错误状态
const resetForm = () => {
  formData.username = '';
  formData.password = '';
  formData.password2 = '';
  errors.username = '';
  errors.password = '';
  errors.confirmPassword = '';
};


// 提交处理函数
const handleSubmit = async () => {
  if (!validateForm()) {
    // 校验失败，直接返回
    return;
  }

  isLoading.value = true;

  // 模拟 API 请求
  try {

    if (isLoginMode.value) {
      await userStore.userLogin(formData);
      closeModal(); // 成功后关闭模态框
      toast.success(`登录成功! 用户名: ${formData.username}`)
      await userStore.userInfo()
      await chatStore.fetchSessions()
      
    } else {
      await userStore.userRegister(formData);
      toast.success(`注册成功!`)
      isLoginMode.value = true
    }

    
  } catch (error) {
    console.error('API Error:', error);
    // 实际处理错误，例如显示错误信息
    toast.error(isLoginMode.value ? '登录失败，请检查用户名或密码。' : '注册失败，用户名可能已存在。')
    
  } finally {
    isLoading.value = false;
  }
};

// 监听 visible 和 isLoginMode 的变化来重置表单和错误状态
watch([() => props.visible, isLoginMode], ([newVisible]) => {
  // 在模态框打开或者模式切换时重置表单
  if (newVisible || !newVisible) {
    resetForm();
  }
  // 模态框关闭时，确保回到登录模式
  if (!newVisible) {
    isLoginMode.value = true;
  }
});
</script>

<style scoped>
/* 继承自您 SettingsModal 的过渡样式 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translate(0%, 0%) scale(0.3);
  /* 调整缩放值使其更柔和 */
}
</style>