<script setup lang="ts">
import { watch } from 'vue';
import TeamColumn from './TeamColumn.vue';
import PeriodTracker from './PeriodTracker.vue';
import LastActionTimer from './LastActionTimer.vue';
import Scoreboard from './Scoreboard.vue';
import EventLog from './EventLog.vue';
import { useMatchStore } from '../stores/useMatchStore';
import type { TchoukTeam, GameSheet } from '../types';

const props = defineProps<{
  teams: TchoukTeam[];
  /** Scopes the match state/storage — usually `"<platformSlug>:<matchId>"`. */
  matchKey: string;
}>();

const emit = defineEmits<{
  'game-event-change': [data: GameSheet];
}>();

// All match state and calculations live in the store; this component is just
// a view over the single source of truth (the sheet).
const store = useMatchStore(props.matchKey);
const { sheet, scores, phase, period, canScore, lastActionAt } = store;

store.setTeams(props.teams);
watch(() => props.teams, (teams) => store.setTeams(teams), { deep: true });

const getOpponents = (team: TchoukTeam) =>
  sheet.teams.filter((t) => t.id !== team.id);

// Re-publish a snapshot of the sheet whenever it changes.
watch(
  () => sheet,
  (data) =>
    emit('game-event-change', {
      ...data,
      teams: [...data.teams],
      events: [...data.events],
    }),
  { deep: true },
);
</script>

<template>
  <PeriodTracker
    :phase="phase"
    :period="period"
    @start-game="store.startGame"
    @start-period="store.startPeriod"
    @end-period="store.endPeriod"
    @end-match="store.endMatch"
  />
  <Scoreboard class="scores" :sheet="sheet" />
  <div class="team-columns" :style="{ '--cols': sheet.teams.length }">
    <TeamColumn
      v-for="team in sheet.teams"
      :key="team.id"
      :id="team.id"
      :name="team.name"
      :opponents="getOpponents(team)"
      :disabled="!canScore"
      :can-decrement="(scores[team.id] ?? 0) > 0"
      @score="store.score"
      @decrement="store.correct(team.id)"
    />
  </div>
  <LastActionTimer
    :since="lastActionAt"
    :active="canScore"
    @end-period="store.endPeriod"
    @end-match="store.endMatch"
  />
  <EventLog :sheet="sheet" @delete="store.removeEvent" />
</template>

<style scoped>
/* The score is what the room reads; the columns below it are what the scorer
   presses. Keep them apart so the two are never mistaken for one block. */
.scores { margin: 1.5rem 0 2rem; }
.team-columns {
  display: grid;
  grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
</style>
