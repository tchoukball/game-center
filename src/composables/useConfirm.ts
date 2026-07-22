import { reactive, readonly } from 'vue';
import type { DeepReadonly } from 'vue';

// Shared, module-level state so every caller and the single <ConfirmDialog>
// host talk to the same dialog. `confirm()` returns a Promise<boolean> that
// resolves true on accept and false on cancel.

export interface ConfirmState {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Hide the cancel button — a single-button acknowledgement (see `alert`). */
  hideCancel: boolean;
}

export interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  /** Drop the cancel button, leaving a single-button acknowledgement. */
  hideCancel?: boolean;
}

const state = reactive<ConfirmState>({
  open: false,
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  hideCancel: false,
});

let resolver: ((result: boolean) => void) | null = null;

/**
 * Ask the user to confirm an action.
 * Resolves true if confirmed, false if cancelled.
 */
function confirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  // If a previous prompt is somehow still open, cancel it before reusing state.
  if (resolver) settle(false);
  state.message = message;
  state.confirmLabel = options.confirmLabel ?? 'Confirm';
  state.cancelLabel = options.cancelLabel ?? 'Cancel';
  state.hideCancel = options.hideCancel ?? false;
  state.open = true;
  return new Promise((resolve) => {
    resolver = resolve;
  });
}

/**
 * Show a single-button acknowledgement (no cancel). Resolves once dismissed —
 * used to inform the user of something they can only accept, not decline.
 */
function alert(message: string, confirmLabel = 'OK'): Promise<void> {
  return confirm(message, { confirmLabel, hideCancel: true }).then(() => {});
}

function settle(result: boolean): void {
  state.open = false;
  if (resolver) {
    const resolve = resolver;
    resolver = null;
    resolve(result);
  }
}

export function useConfirm(): {
  state: DeepReadonly<ConfirmState>;
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, confirmLabel?: string) => Promise<void>;
  accept: () => void;
  cancel: () => void;
} {
  return {
    state: readonly(state),
    confirm,
    alert,
    accept: () => settle(true),
    cancel: () => settle(false),
  };
}
