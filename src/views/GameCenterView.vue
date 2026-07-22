<script setup lang="ts">
import { ref, shallowRef, computed, watch, watchEffect, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TchoukScore from '../components/TchoukScore.vue';
import TchoukLogo from '../components/TchoukLogo.vue';
import { findPlatform, platformName, buildExportUrl } from '../config/platforms';
import { useSheetSync } from '../composables/useSheetSync';
import { useConfirm } from '../composables/useConfirm';
import { openMatch, noSuchMatchMessage } from '../composables/openMatch';
import { useMatchStore, matchKey as buildMatchKey } from '../stores/useMatchStore';
import type { TchoukTeam, GameSheet } from '../types';

const props = defineProps<{ slug: string; edition: string }>();

const router = useRouter();
const platform = computed(() => findPlatform(props.slug));

// Unknown platform slug in the URL — send them back to pick one.
watchEffect(() => {
  if (!platform.value) router.replace({ name: 'home' });
});

// Scopes this match's state and storage.
const matchKey = computed(() => buildMatchKey(props.slug, props.edition));

// Push the sheet to the platform's export endpoint whenever it changes. The URL
// is built lazily so `{CODE}` is filled with this match's edition code.
const { status: syncStatus, sync } = useSheetSync(() =>
  platform.value ? buildExportUrl(platform.value, props.edition) : '',
);

// Tell the user why this match can't continue and send them back to the code
// screen. Idempotent: whichever reason gets there first owns the exit.
const { alert } = useConfirm();
let leaving = false;
const leaveToCodeScreen = async (message: string) => {
  if (leaving) return;
  leaving = true;
  await alert(message);
  router.replace({ name: 'platform', params: { slug: props.slug } });
};

// A failed sync means the match can no longer be reached on the platform.
watch(syncStatus, (status) => {
  if (status === 'failed') {
    leaveToCodeScreen('This match is no longer available. Please re-enter the code to continue.');
  }
});

// Fallback teams for a brand-new match with no prepopulated sheet.
const defaultTeams: TchoukTeam[] = [
  { id: 'italy', name: 'Italy' },
  { id: 'switzerland-m15-bejune', name: 'Switzerland M15 BEJUNE' },
];

// The match, once its code is confirmed to exist on the platform (see below):
// the store, plus the teams from its sheet falling back to the defaults for a
// match with no sheet yet. Both are captured at once, and the teams stay a
// stable snapshot — TchoukScore owns `sheet.teams` from here on, so re-reading
// them would risk a teams -> setTeams -> teams loop.
const match = shallowRef<{
  store: ReturnType<typeof useMatchStore>;
  teams: TchoukTeam[];
} | null>(null);

// Reaching the game center directly — a deep link, a bookmark, or a refresh —
// skips the code form, so the code may never have been checked against the
// platform. Run the same lookup here rather than opening a match that can't
// sync: an unknown code bounces to the form, and a stored sheet that disagrees
// with the synced one asks which to open with. `openMatch` skips the round trip
// when the code form just made it.
onMounted(async () => {
  if (!platform.value) return;
  if (!(await openMatch(platform.value, props.edition))) {
    await leaveToCodeScreen(noSuchMatchMessage(props.edition));
    return;
  }
  const store = useMatchStore(matchKey.value);
  match.value = {
    store,
    teams: store.sheet.teams.length ? [...store.sheet.teams] : defaultTeams,
  };
});

const onGameEventChange = (data: GameSheet) => {
  if (platform.value) sync(data);
};

// The raw sheet JSON is hidden by default; a footer toggle reveals it. It reads
// the live sheet from the store so it renders even before the first change.
const debug = ref(false);
</script>

<template>
  <main v-if="platform">
    <header class="match-head">
      <div class="titles">
        <span
          v-if="platform.logoSvg"
          class="brand platform-logo"
          v-html="platform.logoSvg"
          :aria-label="platformName(platform)"
          role="img"
        />
        <TchoukLogo v-else class="brand" height="1.75rem" />
        <p class="meta">{{ platformName(platform) }} · Game: {{ edition }}</p>
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
    <template v-if="match">
      <TchoukScore
        :teams="match.teams"
        :match-key="matchKey"
        @game-event-change="onGameEventChange"
      />
      <pre v-if="debug" class="debug">{{ JSON.stringify(match.store.sheet, null, 2) }}</pre>
      <button type="button" class="debug-toggle" @click="debug = !debug">
        {{ debug ? 'Hide debug' : 'Debug mode' }}
      </button>
    </template>
    <p v-else class="checking" role="status">Checking code…</p>
    <RouterLink class="back" :to="{ name: 'platform', params: { slug } }">←</RouterLink>
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
.match-head > .titles { flex: 1; text-align: left; }
.brand {
  color: #1e293b;
}
.platform-logo {
  display: block;
}
.platform-logo :deep(svg) {
  height: auto;
  width: auto;
  max-height: 1.75rem;
  max-width: 100%;
  display: block;
}
.meta { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
.back {
  display: block;
  width: fit-content;
  margin: 2rem auto 0;
  color: #64748b;
  text-decoration: none;
  font-size: 1.5rem;
  line-height: 1;
}
.back:hover { color: #1e293b; }
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
.sync.syncing { color: #f47b23; }
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
.checking {
  margin: 2rem 0;
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
}
.debug {
  margin-top: 2rem;
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
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
  color: #cbd5e1;
  font-size: 0.75rem;
  cursor: pointer;
}
.debug-toggle:hover { color: #64748b; }
</style>
