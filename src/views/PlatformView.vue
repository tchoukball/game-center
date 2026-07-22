<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { findPlatform, platformName, platforms } from '../config/platforms';
import { openMatch, noSuchMatchMessage } from '../composables/openMatch';
import QrScanner from '../components/QrScanner.vue';
import TchoukLogo from '../components/TchoukLogo.vue';

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

// Look the code up on the platform first, so the game center opens prepopulated
// (and asks which version to use when this device disagrees with the synced
// sheet). A code with no sheet behind it is reported as incorrect right here.
const submit = async () => {
  const edition = editionCode.value.trim();
  if (!edition || !platform.value || loading.value) return;
  error.value = '';
  loading.value = true;
  try {
    if (!(await openMatch(platform.value, edition, { reconcile: true }))) {
      error.value = noSuchMatchMessage(edition);
      return;
    }
    router.push({ name: 'game-center', params: { slug: props.slug, edition } });
  } finally {
    loading.value = false;
  }
};

// A code is plain enough to drop into a URL as-is: letters, digits, _ - and .
const EDITION_CODE = /^[A-Za-z0-9_.-]+$/;

// Act on a scanned QR code: follow a web link, or take a bare edition code and
// submit it. Anything else isn't something this scanner can act on.
const onScan = (value: string) => {
  scanning.value = false;
  const payload = value.trim();

  let url: URL | null = null;
  try {
    url = new URL(payload);
  } catch {
    // Not a URL — falls through to the edition-code branch.
  }

  if (url?.protocol === 'http:' || url?.protocol === 'https:') {
    // An address on this app is routed to in-place, so we don't reload
    // mid-match; anything else leaves for that site.
    if (url.origin === window.location.origin) {
      router.push(url.pathname + url.search + url.hash);
    } else {
      window.location.href = url.href;
    }
  } else if (EDITION_CODE.test(payload)) {
    editionCode.value = payload;
    submit();
  } else {
    error.value = 'That QR code doesn’t hold a match link or an edition code.';
  }
};
</script>

<template>
  <main v-if="platform">
    <span
      v-if="platform.logoSvg"
      class="brand platform-logo"
      v-html="platform.logoSvg"
      :aria-label="platformName(platform)"
      role="img"
    />
    <TchoukLogo v-else class="brand" height="2.5rem" />
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
.brand {
  color: #1e293b;
  margin: 0 auto 1.25rem;
}
.platform-logo {
  display: block;
}
.platform-logo :deep(svg) {
  height: auto;
  width: auto;
  max-height: 2.5rem;
  max-width: 50%;
  display: block;
  margin: 0 auto;
}
h1 {
  text-align: center;
  margin: 0 0 2rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: -0.01em;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
input {
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #1e293b;
}
button {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: #f47b23;
  color: #fff;
  transition: background 0.15s;
}
button:hover:not(:disabled) { background: #d9641a; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.scan {
  margin-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #1e293b;
}
.scan:hover:not(:disabled) { background: #f1f5f9; }
.error {
  margin: 0.25rem 0 0;
  color: #dc2626;
  font-size: 0.85rem;
}
.back {
  display: block;
  text-align: center;
  margin-top: 1.25rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.9rem;
}
.back:hover { color: #1e293b; }
</style>
