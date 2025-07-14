<template>
  <div 
    class="drop-placeholder"
    :style="{ marginLeft: `${8 + depth * 12}px` }"
  >
    <div class="drop-indicator">
      <span class="drop-text">Drop here</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DropPlaceholder',
  props: {
    depth: {
      type: Number,
      default: 0
    }
  }
})
</script>

<style scoped>
@keyframes placeholder-grow {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: 24px;
    opacity: 1;
  }
}

@keyframes fade-in-move {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.drop-placeholder {
  overflow: hidden;
  animation: placeholder-grow 0.2s ease-out forwards;
  margin: 2px 0;
}

.drop-indicator {
  height: 24px;
  background: rgb(6 182 212 / 0.1);
  border: 1.5px dashed rgb(6 182 212 / 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.drop-text {
  font-size: 11px;
  color: rgb(6 182 212 / 0.8);
  font-weight: 500;
  animation: fade-in-move 0.3s ease-out 0.1s both;
}
</style>