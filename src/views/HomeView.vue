<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { platforms, platformName } from '../config/platforms';

const router = useRouter();
const slug = ref(platforms[0]?.slug ?? '');

// With a single configured platform there is nothing to pick — skip the picker
// and go straight to its edition-code form.
if (platforms.length === 1) {
  router.replace({ name: 'platform', params: { slug: platforms[0].slug } });
}

// Pick a platform, then go to its edition-code form.
const submit = () => {
  if (!slug.value) return;
  router.push({ name: 'platform', params: { slug: slug.value } });
};
</script>

<template>
  <main>
    <h1>Game Center</h1>
    <form class="card" @submit.prevent="submit">
      <label for="platform">Platform</label>
      <select id="platform" v-model="slug">
        <option v-for="p in platforms" :key="p.slug" :value="p.slug">
          {{ platformName(p) }}
        </option>
      </select>
      <button type="submit" :disabled="!slug">Continue</button>
    </form>
  </main>
</template>

<style scoped>
main { width: 100%; max-width: 480px; margin: 0 auto; }
h1 {
  text-align: center;
  margin: 0 0 2rem;
  font-size: 2rem;
  letter-spacing: -0.02em;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
}
label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; }
select {
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
}
button {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  transition: background 0.15s;
}
button:hover:not(:disabled) { background: #1d4ed8; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
