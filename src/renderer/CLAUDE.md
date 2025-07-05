# Renderer Process Documentation

## Overview

The renderer process contains the Vue 3 application that provides the user interface for Framesend. It uses a custom design system with Tailwind CSS and supports light/dark mode theming.

## Architecture

```
renderer/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── base/       # Base components (Button, Icon, etc.)
│   ├── pages/          # Page components
│   │   ├── signin.vue  # Authentication page
│   │   └── upload.vue  # Main encoding interface
│   ├── stores/         # Pinia state management
│   │   ├── router.js   # Navigation state
│   │   └── videoEncoding.js # Video encoding state
│   ├── styles/         # Global styles and Tailwind config
│   ├── App.vue         # Root component
│   └── main.js         # Entry point
```

## Core Components

### Pages

#### upload.vue
The main interface for video encoding operations.

**Features:**
- Drag & drop file upload
- File validation
- Encoding queue management
- Real-time progress tracking
- Light/dark mode support

**Key functionality:**
```javascript
// Add files to encoding queue
await addFilesToQueue(files)

// Watch job progress
watchJobProgress(queueItem, jobId)

// Cancel encoding job
await videoStore.cancelJob(jobId)
```

#### signin.vue
Simple authentication page (currently placeholder).

### Base Components

#### Button.vue
Reusable button component with variants.

**Props:**
- `variant`: 'default' | 'ghost' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean

**Usage:**
```vue
<Button variant="default" size="md" @click="handleClick">
  Click me
</Button>
```

#### Icon.vue
SVG icon component using Heroicons.

**Props:**
- `name`: Icon name from the icon set

**Usage:**
```vue
<Icon name="upload" class="w-6 h-6" />
```

## State Management

### Video Encoding Store

Manages all video encoding related state using Pinia.

**State:**
- `jobs`: Map of active encoding jobs
- `queueStatus`: Current queue status

**Actions:**
- `validateVideo(file)`: Validate video file
- `queueVideo(file)`: Add video to encoding queue
- `cancelJob(jobId)`: Cancel active job
- `removeJob(jobId)`: Remove job from store

**Event Listeners:**
The store automatically sets up listeners for encoding events:
- Progress updates
- Job completion
- Errors
- Cancellations

### Router Store

Simple navigation state management.

**State:**
- `currentPage`: Current active page
- `routes`: Available routes

**Actions:**
- `navigateTo(page)`: Navigate to a page
- `canNavigateTo(page)`: Check if navigation is allowed

## Styling System

### Tailwind Configuration

Custom theme extends Tailwind defaults:
- Custom colors (zinc-based palette)
- Border radius tokens
- Dark mode support via `class` strategy

### Design Tokens

```css
/* Colors */
--zinc-50 to --zinc-950: UI grays
--cyan-500: Primary accent

/* Spacing */
Follows Tailwind defaults

/* Border Radius */
rounded-smooth-sm: 0.25rem
rounded-smooth-md: 0.375rem
rounded-smooth-lg: 0.5rem
```

### Dark Mode

Dark mode is implemented using Tailwind's dark mode classes:

```vue
<div class="bg-white dark:bg-zinc-900">
  <p class="text-zinc-900 dark:text-zinc-100">Hello</p>
</div>
```

## IPC Communication

### API Access

All IPC communication goes through `window.api`:

```javascript
// File operations
await window.api.file.open(options)

// Video operations
await window.api.video.validate(filePath)
await window.api.video.encode(filePath, options)
await window.api.video.cancel(jobId)

// Window operations
await window.api.window.minimize()
```

### Event Handling

Listen for main process events:

```javascript
// Set up listener
const cleanup = window.api.video.onProgress((data) => {
  // Handle progress update
})

// Clean up when done
cleanup()
```

## Component Patterns

### Composition API

All components use Vue 3's Composition API:

```vue
<script>
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubled = computed(() => count.value * 2)
    
    return {
      count,
      doubled
    }
  }
}
</script>
```

### Props and Events

Follow Vue 3 conventions:

```vue
<script>
export default {
  props: {
    modelValue: String,
    disabled: Boolean
  },
  emits: ['update:modelValue', 'submit'],
  setup(props, { emit }) {
    // Component logic
  }
}
</script>
```

## Best Practices

1. **Keep components small** - Extract reusable parts
2. **Use semantic HTML** - Accessibility matters
3. **Follow naming conventions** - PascalCase for components
4. **Handle loading states** - Show progress/spinners
5. **Validate user input** - Prevent errors early
6. **Clean up resources** - Remove event listeners
7. **Use Tailwind utilities** - Avoid custom CSS
8. **Test dark mode** - Ensure good contrast

## Common Patterns

### File Handling

```javascript
// Drag and drop
const handleDrop = async (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  await processFiles(files)
}

// File dialog
const browseFiles = async () => {
  const files = await window.api.video.selectFiles()
  if (files) {
    await processFiles(files)
  }
}
```

### Progress Tracking

```javascript
// Watch job progress
const watchJobProgress = (queueItem, jobId) => {
  const checkInterval = setInterval(() => {
    const job = videoStore.jobs.get(jobId)
    if (!job) {
      clearInterval(checkInterval)
      return
    }
    
    // Update UI with progress
    queueItem.progress = job.progress
    
    if (job.status === 'complete' || job.status === 'error') {
      clearInterval(checkInterval)
    }
  }, 1000)
}
```

### Error Handling

```javascript
try {
  await riskyOperation()
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly error
  showError('Something went wrong. Please try again.')
}
```

## Future Enhancements

- Settings page for encoding configuration
- Video preview/playback
- Batch operations
- Export queue management
- Analytics dashboard
- Keyboard shortcuts
- Accessibility improvements