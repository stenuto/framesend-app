<template>
  <div class="p-4">
    <h2 class="text-lg font-semibold mb-4">Manage Labels</h2>
    
    <!-- Label List -->
    <div class="space-y-2 mb-4">
      <div v-for="label in labelsStore.labels" :key="label.id" 
        class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
        
        <!-- Label Preview -->
        <Badge :variant="'custom'" :color="label.color" :shade="label.shade" class="text-xs">
          {{ label.name }}
        </Badge>
        
        <!-- Edit Form -->
        <div v-if="editingId === label.id" class="flex-1 flex items-center gap-2">
          <Input v-model="editForm.name" placeholder="Label name" class="flex-1" size="sm" />
          
          <!-- Color Picker -->
          <select v-model="editForm.color" class="text-sm border border-gray-300 rounded px-2 py-1">
            <option v-for="color in labelsStore.availableColors" :key="color" :value="color">
              {{ color }}
            </option>
          </select>
          
          <!-- Shade Picker -->
          <select v-model.number="editForm.shade" class="text-sm border border-gray-300 rounded px-2 py-1">
            <option value="100">Light</option>
            <option value="500">Medium</option>
          </select>
          
          <Button @click="saveEdit" size="sm" variant="secondary">Save</Button>
          <Button @click="cancelEdit" size="sm" variant="ghost">Cancel</Button>
        </div>
        
        <!-- View Mode -->
        <div v-else class="flex-1 flex items-center justify-between">
          <span class="text-sm text-gray-700">{{ label.name }}</span>
          <div class="flex items-center gap-1">
            <Button @click="startEdit(label)" size="sm" variant="ghost">
              <Icon name="edit-2" size="sm" />
            </Button>
            <Button @click="deleteLabel(label.id)" size="sm" variant="ghost" class="text-red-600 hover:text-red-700">
              <Icon name="trash-2" size="sm" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add New Label -->
    <div class="border-t pt-4">
      <h3 class="text-sm font-medium mb-2">Add New Label</h3>
      <div class="flex items-center gap-2">
        <Input v-model="newLabel.name" placeholder="Label name" class="flex-1" size="sm" />
        
        <!-- Color Picker -->
        <select v-model="newLabel.color" class="text-sm border border-gray-300 rounded px-2 py-1">
          <option v-for="color in labelsStore.availableColors" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
        
        <!-- Shade Picker -->
        <select v-model.number="newLabel.shade" class="text-sm border border-gray-300 rounded px-2 py-1">
          <option value="100">Light</option>
          <option value="500">Medium</option>
        </select>
        
        <Button @click="createLabel" :disabled="!newLabel.name" size="sm" variant="primary">
          Add Label
        </Button>
      </div>
      
      <!-- Preview -->
      <div v-if="newLabel.name" class="mt-2">
        <span class="text-xs text-gray-500">Preview:</span>
        <Badge :variant="'custom'" :color="newLabel.color" :shade="newLabel.shade" class="text-xs ml-2">
          {{ newLabel.name }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useLabelsStore } from '../../stores/labels'
import Badge from '../base/Badge.vue'
import Button from '../base/Button.vue'
import Input from '../base/Input.vue'
import Icon from '../base/Icon.vue'

const labelsStore = useLabelsStore()

// New label form
const newLabel = reactive({
  name: '',
  color: 'blue',
  shade: 500
})

// Edit state
const editingId = ref(null)
const editForm = reactive({
  name: '',
  color: '',
  shade: 500
})

function createLabel() {
  if (!newLabel.name) return
  
  labelsStore.createLabel({
    name: newLabel.name,
    color: newLabel.color,
    shade: newLabel.shade
  })
  
  // Reset form
  newLabel.name = ''
  newLabel.color = 'blue'
  newLabel.shade = 500
}

function startEdit(label) {
  editingId.value = label.id
  editForm.name = label.name
  editForm.color = label.color
  editForm.shade = label.shade
}

function saveEdit() {
  labelsStore.updateLabel(editingId.value, {
    name: editForm.name,
    color: editForm.color,
    shade: editForm.shade
  })
  cancelEdit()
}

function cancelEdit() {
  editingId.value = null
  editForm.name = ''
  editForm.color = ''
  editForm.shade = 500
}

function deleteLabel(id) {
  if (confirm('Are you sure you want to delete this label?')) {
    labelsStore.deleteLabel(id)
  }
}
</script>