<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { buildExportUrl, findPlatform, platformName, platforms } from '../config/platforms';
import { fetchSheet } from '../composables/useSheetSync';
import { seedSheet } from '../stores/useMatchStore';
import QrScanner from '../components/QrScanner.vue';

const props = defineProps<{ slug: string }>();

const router = useRouter();
const platform = computed(() => findPlatform(props.slug));

// Only worth offering "change platform" when there is more than one to pick.
const canChangePlatform = platforms.length > 1;

// Unknown platform slug in the URL — send them back to pick one.
watchEffect(() => {
  if (!platform.value) router.replace({ name: 'home' });
});

const editionCode = ref('');
const scanning = ref(false);
const loading = ref(false);
const error = ref('');

// A fresh edit means the previous "incorrect code" verdict no longer applies.
watch(editionCode, () => { error.value = ''; });

// Look the code up on the platform first: fetch the existing sheet so the game
// center opens prepopulated. A code with no sheet behind it is reported as
// incorrect and we stay on this screen.
const submit = async () => {
  const edition = editionCode.value.trim();
  if (!edition || !platform.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    const sheet = await fetchSheet(buildExportUrl(platform.value, edition));
    if (!sheet) {
      error.value = 'That code doesn’t match an existing sheet. Check it and try again.';
      return;
    }
    seedSheet(`${props.slug}:${edition}`, sheet);
    router.push({ name: 'game-center', params: { slug: props.slug, edition } });
  } finally {
    loading.value = false;
  }
};

// A scanned QR code becomes the edition code and submits immediately.
const onScan = (value: string) => {
  scanning.value = false;
  editionCode.value = value.trim();
  submit();
};
</script>

<template>
  <main v-if="platform">
    <h1>{{ platformName(platform) }}</h1>
    <form class="card" @submit.prevent="submit">
      <label for="edition-code">Edition code</label>
      <input
        id="edition-code"
        v-model="editionCode"
        type="text"
        inputmode="text"
        placeholder="e.g. 12345"
        autofocus
      />
      <button type="submit" :disabled="!editionCode.trim() || loading">
        {{ loading ? 'Checking code…' : 'Open match center' }}
      </button>
      <button type="button" class="scan" :disabled="loading" @click="scanning = true">
        <span aria-hidden="true">⛶</span> Scan QR code
      </button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>
    <RouterLink v-if="canChangePlatform" class="back" :to="{ name: 'home' }">← Change platform</RouterLink>
  </main>
  <QrScanner v-if="scanning" @scan="onScan" @close="scanning = false" />
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
input {
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
.scan {
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #475569;
  color: #e2e8f0;
}
.scan:hover:not(:disabled) { background: #0f172a; }
.error {
  margin: 0.25rem 0 0;
  color: #f87171;
  font-size: 0.85rem;
}
.back {
  display: block;
  text-align: center;
  margin-top: 1.25rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
}
.back:hover { color: #e2e8f0; }
</style>
