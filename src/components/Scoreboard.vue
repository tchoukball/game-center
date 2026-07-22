<script setup lang="ts">
import { computed } from 'vue';
import { computeScores } from '../types';
import type { GameSheet } from '../types';

const props = defineProps<{
  sheet: GameSheet;
}>();

const scores = computed(() => computeScores(props.sheet.events));
</script>

<template>
  <section class="scoreboard" :style="{ '--cols': sheet.teams.length }">
    <div v-for="team in sheet.teams" :key="team.id" class="team">
      <span class="name">{{ team.name }}</span>
      <span class="score">{{ scores[team.id] ?? 0 }}</span>
    </div>
  </section>
</template>

<style scoped>
/* One dark panel for the whole score — a display, not a control. The white
   cards below it are the things you press; this is the thing you read. */
.scoreboard {
  display: grid;
  grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
  background: #1e293b;
  border-radius: 12px;
  padding: 1.25rem 0.5rem;
}
.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
}
.team + .team { border-left: 1px solid rgba(248, 250, 252, 0.12); }
.name {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
  text-align: center;
}
.score {
  font-size: 3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #f8fafc;
}
</style>
