<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import TchoukScore from '../components/TchoukScore.vue';
import { findPlatform, platformName, buildExportUrl } from '../config/platforms';
import { useSheetSync } from '../composables/useSheetSync';
import { useMatchStore } from '../stores/useMatchStore';
import type { TchoukTeam, GameSheet } from '../types';

const props = defineProps<{ slug: string; edition: string }>();

const router = useRouter();
const platform = computed(() => findPlatform(props.slug));

// Unknown platform slug in the URL — send them back to pick one.
watchEffect(() => {
  if (!platform.value) router.replace({ name: 'home' });
});

// Scopes this match's state and storage.
const matchKey = computed(() => `${props.slug}:${props.edition}`);

// Push the sheet to the platform's export endpoint whenever it changes. The URL
// is built lazily so `{CODE}` is filled with this match's edition code.
const { status: syncStatus, sync } = useSheetSync(() =>
  platform.value ? buildExportUrl(platform.value, props.edition) : '',
);

// Fallback teams for a brand-new match with no prepopulated sheet.
const defaultTeams: TchoukTeam[] = [
  { id: 'italy', name: 'Italy' },
  { id: 'switzerland-m15-bejune', name: 'Switzerland M15 BEJUNE' },
];

// Prefer the teams from a sheet prepopulated on the platform screen (or restored
// from storage), falling back to the defaults for a match with no sheet yet.
// Read once at mount: TchoukScore owns `sheet.teams` from here on, so keeping
// this a stable snapshot avoids a teams -> setTeams -> teams reactive loop.
const seededTeams = useMatchStore(matchKey.value).sheet.teams;
const teams: TchoukTeam[] = seededTeams.length
  ? seededTeams.map((t) => ({ id: t.id, name: t.name }))
  : defaultTeams;

const lastEvent = ref<GameSheet | null>(null);
const onGameEventChange = (data: GameSheet) => {
  lastEvent.value = data;
  if (platform.value) sync(data);
};

// The raw sheet JSON is hidden by default; a footer toggle reveals it.
const debug = ref(false);
</script>

<template>
  <main v-if="platform">
    <header class="match-head">
      <RouterLink class="back" :to="{ name: 'platform', params: { slug } }">←</RouterLink>
      <div class="titles">
        <h1>Game Center</h1>
        <p class="meta">{{ platformName(platform) }} · Edition {{ edition }}</p>
      </div>
      <div
        class="sync"
        :class="syncStatus"
        :title="{
          idle: 'Waiting for changes',
          syncing: 'Syncing…',
          synced: 'Synced',
          failed: 'Sync failed',
        }[syncStatus]"
        role="status"
        aria-live="polite"
      >
        <span v-if="syncStatus === 'syncing'" class="spinner" aria-hidden="true" />
        <span v-else-if="syncStatus === 'synced'" aria-hidden="true">✓</span>
        <span v-else-if="syncStatus === 'failed'" aria-hidden="true">✕</span>
        <span v-else aria-hidden="true">•</span>
      </div>
    </header>
    <TchoukScore
      :teams="teams"
      :match-key="matchKey"
      @game-event-change="onGameEventChange"
    />
    <pre v-if="debug && lastEvent" class="debug">{{ JSON.stringify(lastEvent, null, 2) }}</pre>
    <button type="button" class="debug-toggle" @click="debug = !debug">
      {{ debug ? 'Hide debug' : 'Debug mode' }}
    </button>
  </main>
</template>

<style scoped>
main { width: 100%; max-width: 720px; margin: 0 auto; }
.match-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.match-head > .titles { flex: 1; text-align: center; }
h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.02em;
}
.meta { margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.9rem; }
.back {
  color: #94a3b8;
  text-decoration: none;
  font-size: 1.5rem;
  line-height: 1;
}
.back:hover { color: #e2e8f0; }
.sync {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.sync.idle { color: #64748b; }
.sync.syncing { color: #60a5fa; }
.sync.synced {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
}
.sync.failed {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
}
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.debug {
  margin-top: 2rem;
  padding: 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
}
.debug-toggle {
  display: block;
  margin: 2rem auto 0;
  padding: 0.35rem 0.75rem;
  background: transparent;
  border: none;
  color: #475569;
  font-size: 0.75rem;
  cursor: pointer;
}
.debug-toggle:hover { color: #94a3b8; }
</style>
