<template>
  <nav class="drag h-9 flex items-center border-b border-gray-300 bg-gray-200 w-full shrink-0 pl-24 pr-3 items-center">
    <div class="flex-1 flex items-center justify-center" />
    <div class="flex items-center gap-0.5">
      <Button variant="ghost" iconName="chart-no-axes-combined" />
      <Button variant="ghost" iconName="cloud" />
      <Button variant="ghost" iconName="settings" />
    </div>
  </nav>
</template>

<script setup>
import Button from '../base/Button.vue'
</script>