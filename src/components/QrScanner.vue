<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import jsQR from 'jsqr';

const emit = defineEmits<{
  /** A QR code was decoded — carries its text payload. */
  scan: [value: string];
  /** The user dismissed the scanner without a result. */
  close: [];
}>();

const video = useTemplateRef<HTMLVideoElement>('video');
const error = ref<string | null>(null);

let stream: MediaStream | null = null;
let rafId: number | null = null;
let canvas: HTMLCanvasElement | null = null;
// Guards against emitting twice if a frame decodes while we are tearing down.
let done = false;

const stop = () => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
};

const tick = () => {
  const el = video.value;
  if (done || !el || el.readyState < el.HAVE_ENOUGH_DATA) {
    rafId = requestAnimationFrame(tick);
    return;
  }

  if (!canvas) canvas = document.createElement('canvas');
  canvas.width = el.videoWidth;
  canvas.height = el.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    rafId = requestAnimationFrame(tick);
    return;
  }

  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(image.data, image.width, image.height, {
    inversionAttempts: 'dontInvert',
  });

  if (result?.data) {
    done = true;
    stop();
    emit('scan', result.data);
    return;
  }
  rafId = requestAnimationFrame(tick);
};

onMounted(async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Camera access is not available on this device.';
    return;
  }
  try {
    // Prefer the rear camera on phones.
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
    });
    const el = video.value;
    if (!el) return;
    el.srcObject = stream;
    await el.play();
    rafId = requestAnimationFrame(tick);
  } catch {
    error.value = 'Could not access the camera. Check permissions and try again.';
  }
});

onBeforeUnmount(stop);
</script>

<template>
  <div class="scanner" role="dialog" aria-modal="true" aria-label="Scan QR code">
    <div class="frame">
      <video v-show="!error" ref="video" playsinline muted />
      <div v-if="error" class="error">{{ error }}</div>
      <div v-else class="reticle" />
    </div>
    <p class="hint">{{ error ? '' : 'Point the camera at the code' }}</p>
    <button type="button" class="cancel" @click="emit('close')">Cancel</button>
  </div>
</template>

<style scoped>
.scanner {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(2, 6, 23, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
}
.frame {
  position: relative;
  width: min(80vw, 320px);
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
}
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.reticle {
  position: absolute;
  inset: 12%;
  border: 3px solid rgba(255, 208, 28, 0.9);
  border-radius: 12px;
  box-shadow: 0 0 0 100vmax rgba(2, 6, 23, 0.35);
}
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1.5rem;
  text-align: center;
  color: #fecaca;
  font-size: 0.95rem;
}
.hint {
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
  min-height: 1.2em;
}
.cancel {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #475569;
  border-radius: 999px;
  background: transparent;
  color: #e2e8f0;
}
.cancel:hover { background: #1e293b; }
</style>
