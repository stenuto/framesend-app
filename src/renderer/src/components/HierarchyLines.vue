<template>
  <div v-for="i in depth" :key="i" :class="lineClasses" :style="getLineStyle(i)"></div>
</template>

<script>
export default {
  name: 'HierarchyLines',
  props: {
    depth: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return {
      lineClasses: props.config.lineClasses,
      getLineStyle: props.config.getLineStyle
    }
  }
}
</script>