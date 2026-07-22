<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue';
import { useConfirm } from '../composables/useConfirm';

const { state, accept, cancel } = useConfirm();

// Buttons that carry a table are a choice between two things, not an
// approve/dismiss pair: give each its own full-width row so both can be read.
const detailed = computed(
  () => Boolean(state.confirmTable.length || state.cancelTable.length),
);

// The buttons, in the order they are shown. Both are the same thing — a label,
// what it means, and what happens when it is pressed — so the template renders
// them from one list rather than spelling each out.
const choices = computed(() => [
  ...(state.hideCancel
    ? []
    : [
        {
          kind: 'cancel' as const,
          label: state.cancelLabel,
          table: state.cancelTable,
          act: cancel,
        },
      ]),
  {
    kind: 'confirm' as const,
    label: state.confirmLabel,
    table: state.confirmTable,
    act: accept,
  },
]);

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') cancel();
  else if (e.key === 'Enter') accept();
};

watch(
  () => state.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown);
    else window.removeEventListener('keydown', onKeydown);
  },
);

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Transition name="confirm-fade">
    <div v-if="state.open" class="confirm-overlay" @click.self="cancel">
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <p class="confirm-message">{{ state.message }}</p>
        <div class="confirm-actions" :class="{ detailed }">
          <button
            v-for="choice in choices"
            :key="choice.kind"
            :class="[choice.kind, { highlighted: state.highlight === choice.kind }]"
            :autofocus="choice.kind === 'confirm'"
            @click="choice.act"
          >
            <span class="label">{{ choice.label }}</span>
            <!-- A grid rather than a <table>: only phrasing content is valid
                 inside a button, and the columns line up either way. -->
            <span
              v-if="choice.table.length"
              class="choice-table"
              :style="{
                gridTemplateColumns: `auto repeat(${choice.table[0].length - 1}, 1.9rem)`,
              }"
            >
              <span
                v-for="(cell, i) in choice.table[0]"
                :key="`head-${i}`"
                class="head"
                :class="i === 0 ? 'lead' : 'figure'"
              >{{ cell }}</span>
              <template v-for="(row, r) in choice.table.slice(1)" :key="r">
                <span
                  v-for="(cell, i) in row"
                  :key="i"
                  :class="i === 0 ? 'lead' : 'figure'"
                >{{ cell }}</span>
              </template>
            </span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
}
.confirm-dialog {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}
.confirm-message {
  margin: 0 0 1.25rem;
  font-size: 1rem;
  line-height: 1.4;
  color: #1e293b;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
button {
  cursor: pointer;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s;
}
.cancel {
  background: transparent;
  color: #64748b;
}
.cancel:hover { background: #e2e8f0; }
.accept {
  background: #dc2626;
  border-color: #b91c1c;
  color: #fee2e2;
}
.accept:hover { background: #b91c1c; }

/* Two described choices: stacked, full width, and weighted equally — neither is
   the destructive one, so neither gets the red treatment. The caller may mark
   one of them, which takes the accent border. */
.confirm-actions.detailed {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}
.detailed button {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem 0.9rem;
  text-align: left;
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #1e293b;
}
.detailed button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
/* The stand-out option, marked by the caller: the app's orange border. */
.detailed .highlighted,
.detailed .highlighted:hover {
  border-color: #f47b23;
}
/* The button's own name is a quiet caption over the table. */
.detailed .label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}

/* A choice laid out as a small table: the leading column is the figure that
   matters, the ones after it break it down. */
.choice-table {
  display: grid;
  column-gap: 0.25rem;
  row-gap: 0.2rem;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
}
.choice-table .head {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #e2e8f0;
}
.choice-table .figure {
  text-align: right;
  font-size: 0.9rem;
  font-weight: 400;
  color: #64748b;
}
/* The leading column carries the weight — it is what the eye compares first,
   and a rule sets it apart from the columns that break it down. */
.choice-table .lead {
  text-align: right;
  min-width: 2.4rem;
  padding-right: 0.5rem;
  border-right: 1px solid #e2e8f0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}
.choice-table .head.lead {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
}
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
