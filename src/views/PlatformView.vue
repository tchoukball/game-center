<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { buildExportUrl, findPlatform, platformName, platforms } from '../config/platforms';
import { fetchSheet } from '../composables/useSheetSync';
import { peekSheet, seedSheet } from '../stores/useMatchStore';
import { useConfirm } from '../composables/useConfirm';
import { computeScores } from '../types';
import type { GameSheet } from '../types';
import QrScanner from '../components/QrScanner.vue';
import TchoukLogo from '../components/TchoukLogo.vue';

const props = defineProps<{ slug: string }>();

const router = useRouter();
const { confirm } = useConfirm();
const platform = computed(() => findPlatform(props.slug));

// A one-line "Italy 5 – 3 Switzerland" summary of a sheet's current scores.
const formatScore = (sheet: GameSheet) => {
  const scores = computeScores(sheet.events);
  return sheet.teams.map((t) => `${t.name} ${scores[t.id] ?? 0}`).join(' – ');
};

// Whether two sheets disagree on any team's score.
const scoresDiffer = (a: GameSheet, b: GameSheet) => {
  const sa = computeScores(a.events);
  const sb = computeScores(b.events);
  const ids = new Set([...Object.keys(sa), ...Object.keys(sb)]);
  for (const id of ids) if ((sa[id] ?? 0) !== (sb[id] ?? 0)) return true;
  return false;
};

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
      error.value = 'That code doesn’t match an existing match. Check it and try again.';
      return;
    }
    const matchKey = `${props.slug}:${edition}`;
    // A saved version on this device whose score disagrees with the synced sheet
    // means one of them is stale — let the user choose which to open with.
    const local = peekSheet(matchKey);
    if (local && scoresDiffer(local, sheet)) {
      const useSynced = await confirm(
        `Scores differ for this match — this device shows ${formatScore(local)}, ` +
          `the synced sheet shows ${formatScore(sheet)}. Which do you want to use?`,
        { confirmLabel: 'Use synced sheet', cancelLabel: 'Keep this device' },
      );
      // Keeping this device's version: leave storage untouched, just open it.
      if (!useSynced) {
        router.push({ name: 'game-center', params: { slug: props.slug, edition } });
        return;
      }
    }
    seedSheet(matchKey, sheet);
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
