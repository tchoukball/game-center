<script setup lang="ts">
// The TchoukSheet mark — icon only (the wordmark is dropped). The sheet keeps
// its gold -> orange gradient. Size it by setting `height`; the width scales to
// preserve the (square) aspect ratio.
withDefaults(defineProps<{ height?: string }>(), { height: '2rem' });
</script>

<template>
  <svg
    role="img"
    aria-label="TchoukSheet"
    viewBox="0 0 171 171"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :style="{ height, width: 'auto', display: 'block' }"
    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
  >
    <g transform="matrix(2.0129,0,0,2.0129,-4563.14,-11716.3)">
      <g transform="matrix(1.54753,0,0,2.39537,-1755.51,-5089.5)">
        <path d="M2599.28,4572.94L2599.28,4554.66L2654.13,4554.66L2654.13,4558.34L2641.78,4569.74C2628.01,4564.47 2610.57,4565.9 2599.28,4572.94ZM2654.13,4564.41L2654.13,4590.1L2626.28,4590.1L2654.13,4564.41ZM2619.71,4590.1L2599.28,4590.1L2599.28,4578.27C2608.24,4570.02 2625.4,4567.67 2638.68,4572.6L2619.71,4590.1Z" style="fill:url(#_Linear1);" />
      </g>
    </g>
    <defs>
      <linearGradient id="_Linear1" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1.08498e-15,17.7191,-17.7191,1.08498e-15,2626.7,4572.38)">
        <stop offset="0" style="stop-color:rgb(255,208,28);stop-opacity:1" />
        <stop offset="1" style="stop-color:rgb(244,123,35);stop-opacity:1" />
      </linearGradient>
    </defs>
  </svg>
</template>
