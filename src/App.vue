<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { RouterView } from 'vue-router';
import ConfirmDialog from './components/ConfirmDialog.vue';

const isOnline = ref(navigator.onLine);
const transientMessage = ref<string | null>(null);
let messageTimer: ReturnType<typeof setTimeout> | undefined;

const flash = (text: string) => {
  transientMessage.value = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (transientMessage.value = null), 3000);
};

const handleOnline = () => {
  isOnline.value = true;
  flash('Back online');
};
const handleOffline = () => {
  isOnline.value = false;
  flash('You are offline — the app keeps working');
};

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});
onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  clearTimeout(messageTimer);
});
</script>

<template>
  <Transition name="fade">
    <div
      v-if="transientMessage"
      class="status-banner"
      :class="isOnline ? 'online' : 'offline'"
      role="status"
      aria-live="polite"
    >
      <span class="dot" />
      {{ transientMessage }}
    </div>
  </Transition>
  <RouterView />
  <ConfirmDialog />
</template>

<style>
* { box-sizing: border-box; }
:root { accent-color: #f47b23; }
:focus-visible {
  outline: 2px solid #f47b23;
  outline-offset: 2px;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: #f1f5f9;
  color: #1e293b;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.status-banner {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 1000;
  border: 1px solid;
  backdrop-filter: blur(8px);
}
.status-banner.offline {
  background: rgba(127, 29, 29, 0.85);
  border-color: #b91c1c;
  color: #fee2e2;
}
.status-banner.online {
  background: rgba(20, 83, 45, 0.85);
  border-color: #15803d;
  color: #dcfce7;
}
.status-banner .dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}
</style>
