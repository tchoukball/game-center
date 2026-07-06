<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import TchoukScore from '../components/TchoukScore.vue';
import { findPlatform, platformName } from '../config/platforms';
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

const teams: TchoukTeam[] = [
  { id: 'italy', name: 'Italy' },
  { id: 'switzerland-m15-bejune', name: 'Switzerland M15 BEJUNE' },
];

const lastEvent = ref<GameSheet | null>(null);
const onGameEventChange = (data: GameSheet) => {
  lastEvent.value = data;
  console.log('game-event-change', data);
};
</script>

<template>
  <main v-if="platform">
    <header class="match-head">
      <RouterLink class="back" :to="{ name: 'platform', params: { slug } }">←</RouterLink>
      <div>
        <h1>Game Center</h1>
        <p class="meta">{{ platformName(platform) }} · Edition {{ edition }}</p>
      </div>
    </header>
    <TchoukScore
      :teams="teams"
      :match-key="matchKey"
      @game-event-change="onGameEventChange"
    />
    <pre v-if="lastEvent" class="debug">{{ JSON.stringify(lastEvent, null, 2) }}</pre>
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
.match-head > div { flex: 1; text-align: center; }
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
.debug {
  margin-top: 2rem;
  padding: 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
}
</style>
