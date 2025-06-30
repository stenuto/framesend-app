import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFileExplorerStore = defineStore('fileExplorer', () => {
  // Folders table - compatible with: id, name, parent_id, order_index, item_order, created_at, updated_at
  const folders = ref([
    { id: 'list1', name: '01_Introduction', parentId: null, orderIndex: 0, itemOrder: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'list1-archived', name: 'archived', parentId: 'list1', orderIndex: 0, itemOrder: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'list2', name: '02_Getting_Started', parentId: null, orderIndex: 1, itemOrder: 2, createdAt: new Date('2024-01-02'), updatedAt: new Date('2024-01-02') },
    { id: 'list3', name: '03_Core_Concepts', parentId: null, orderIndex: 2, itemOrder: 3, createdAt: new Date('2024-01-03'), updatedAt: new Date('2024-01-03') },
    { id: 'list4', name: '04_Advanced_Topics', parentId: null, orderIndex: 3, itemOrder: 4, createdAt: new Date('2024-01-04'), updatedAt: new Date('2024-01-04') },
    { id: 'list5', name: 'Module_1', parentId: null, orderIndex: 4, itemOrder: 5, createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-05') },
    { id: 'list6', name: 'Module_2', parentId: null, orderIndex: 5, itemOrder: 6, createdAt: new Date('2024-01-06'), updatedAt: new Date('2024-01-06') },
    { id: 'list7', name: 'Module_3', parentId: null, orderIndex: 6, itemOrder: 7, createdAt: new Date('2024-01-07'), updatedAt: new Date('2024-01-07') },
    { id: 'list8', name: 'Bonus_Content', parentId: null, orderIndex: 7, itemOrder: 8, createdAt: new Date('2024-01-08'), updatedAt: new Date('2024-01-08') }
  ])

  // Files table - compatible with: id, name, folder_id, order_index, item_order, file_type, metadata, created_at, updated_at
  const files = ref([
    // Marketing Campaign 2024
    {
      id: 'vid1',
      name: 'Brand Awareness Video',
      folderId: 'list1',
      orderIndex: 0,
      itemOrder: 1,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' }
        ],
        labels: ['1', '2'],
        duration: '2:45'
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'vid2',
      name: 'Product Launch Teaser',
      folderId: 'list1',
      orderIndex: 1,
      itemOrder: 2,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
        ],
        labels: ['4'],
        duration: '0:30'
      },
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16')
    },
    {
      id: 'vid2-archived-1',
      name: 'Old Introduction Video',
      folderId: 'list1-archived',
      orderIndex: 0,
      itemOrder: 1,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [],
        labels: ['4'],
        duration: '2:15'
      },
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2023-12-01')
    },
    {
      id: 'vid2-archived-2',
      name: 'Deprecated Welcome Message',
      folderId: 'list1-archived',
      orderIndex: 1,
      itemOrder: 2,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [],
        labels: ['2'],
        duration: '1:30'
      },
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2023-11-15')
    },
    {
      id: 'vid3',
      name: 'Customer Success Story',
      folderId: 'list2',
      orderIndex: 0,
      itemOrder: 0,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' },
          { id: 'user3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/100?img=8' }
        ],
        labels: ['3'],
        duration: '5:12'
      },
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17')
    },
    {
      id: 'vid4',
      name: 'Social Media Ad - Version A',
      folderId: 'list3',
      orderIndex: 0,
      itemOrder: 0,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
        ],
        labels: ['5', '3'],
        duration: '0:15'
      },
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: 'vid7',
      name: 'Behind the Scenes - Making Of',
      folderId: 'list1',
      orderIndex: 2,
      itemOrder: 3,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/100?img=8' }
        ],
        labels: ['6'],
        duration: '3:20'
      },
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19')
    },
    {
      id: 'vid8',
      name: 'Company Culture Video',
      folderId: 'list2',
      orderIndex: 1,
      itemOrder: 1,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' },
          { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' }
        ],
        labels: ['2', '3'],
        duration: '4:15'
      },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'vid9',
      name: 'Holiday Campaign Promo',
      folderId: 'list1',
      orderIndex: 3,
      itemOrder: 4,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
        ],
        labels: ['1', '4'],
        duration: '1:00'
      },
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21')
    },
    {
      id: 'vid10',
      name: 'Email Campaign Video',
      folderId: 'list3',
      orderIndex: 1,
      itemOrder: 1,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
        ],
        labels: ['7'],
        duration: '0:45'
      },
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    },
    {
      id: 'vid11',
      name: 'Q4 Results Presentation',
      folderId: 'list4',
      orderIndex: 0,
      itemOrder: 0,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' },
          { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' }
        ],
        labels: ['7', '3'],
        duration: '12:30'
      },
      createdAt: new Date('2024-01-23'),
      updatedAt: new Date('2024-01-23')
    },
    {
      id: 'vid12',
      name: 'Instagram Reels - Product Feature',
      folderId: 'list2',
      orderIndex: 2,
      itemOrder: 2,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' },
          { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
        ],
        labels: ['5', '6'],
        duration: '0:20'
      },
      createdAt: new Date('2024-01-24'),
      updatedAt: new Date('2024-01-24')
    },
    // Product Demos
    {
      id: 'vid5',
      name: 'Feature Overview 2024',
      folderId: 'list5',
      orderIndex: 0,
      itemOrder: 0,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' }
        ],
        labels: ['2'],
        duration: '8:30'
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'vid6',
      name: 'Mobile App Walkthrough',
      folderId: 'list6',
      orderIndex: 0,
      itemOrder: 0,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
        ],
        labels: ['4'],
        duration: '6:45'
      },
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12')
    },
    // Root level video to test mixed ordering
    {
      id: 'vid13',
      name: 'Welcome Video',
      folderId: null,
      orderIndex: 0,
      itemOrder: 1,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' }
        ],
        labels: ['1'],
        duration: '3:00'
      },
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    }
  ])

  // UI State - compatible with a ui_state table or key-value store
  const uiState = ref({
    expandedFolders: new Set(['list1', 'list2']),
    selectedItemId: null,
    selectedItemType: null // 'file' or 'folder'
  })

  // Computed properties for queries
  const allFolders = computed(() => {
    return folders.value.sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const rootFolders = computed(() => {
    return folders.value
      .filter(f => f.parentId === null)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const getFoldersByParent = computed(() => {
    return (parentId) => folders.value
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const allFiles = computed(() => {
    return files.value
  })

  const getFilesByFolder = computed(() => {
    return (folderId) => files.value
      .filter(f => f.folderId === folderId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const getFileById = computed(() => {
    return (fileId) => files.value.find(f => f.id === fileId)
  })

  const getFolderById = computed(() => {
    return (folderId) => folders.value.find(f => f.id === folderId)
  })

  // Get all items (folders and files) in a parent, sorted by itemOrder
  const getItemsByParent = computed(() => {
    return (parentId) => {
      const folderItems = folders.value
        .filter(f => f.parentId === parentId)
        .map(f => ({ ...f, type: 'folder' }))
      
      const fileItems = files.value
        .filter(f => f.folderId === parentId)
        .map(f => ({ ...f, type: 'video' }))
      
      return [...folderItems, ...fileItems].sort((a, b) => a.itemOrder - b.itemOrder)
    }
  })

  // UI State methods
  function toggleFolder(folderId) {
    const expanded = new Set(uiState.value.expandedFolders)
    if (expanded.has(folderId)) {
      expanded.delete(folderId)
    } else {
      expanded.add(folderId)
    }
    uiState.value.expandedFolders = expanded
  }

  function expandFolder(folderId) {
    const expanded = new Set(uiState.value.expandedFolders)
    expanded.add(folderId)
    uiState.value.expandedFolders = expanded
  }

  function collapseFolder(folderId) {
    const expanded = new Set(uiState.value.expandedFolders)
    expanded.delete(folderId)
    uiState.value.expandedFolders = expanded
  }

  function isExpanded(folderId) {
    return uiState.value.expandedFolders.has(folderId)
  }

  function setSelectedItem(itemId, itemType) {
    uiState.value.selectedItemId = itemId
    uiState.value.selectedItemType = itemType
  }

  function clearSelection() {
    uiState.value.selectedItemId = null
    uiState.value.selectedItemType = null
  }

  // CRUD operations for folders
  function createFolder(folderData) {
    const now = new Date()
    const foldersAtLevel = folders.value.filter(f => f.parentId === folderData.parentId)
    const nextOrderIndex = foldersAtLevel.length
    const nextItemOrder = foldersAtLevel.reduce((max, folder) => Math.max(max, folder.itemOrder || 0), -1) + 1
    
    const newFolder = {
      id: `folder_${Date.now()}`,
      name: folderData.name,
      parentId: folderData.parentId || null,
      orderIndex: folderData.orderIndex ?? nextOrderIndex,
      itemOrder: folderData.itemOrder ?? nextItemOrder,
      createdAt: now,
      updatedAt: now
    }
    folders.value.push(newFolder)
    return newFolder
  }

  function updateFolder(folderId, updates) {
    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      folders.value[index] = {
        ...folders.value[index],
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  function deleteFolder(folderId) {
    // Delete all files in folder first
    files.value = files.value.filter(f => f.folderId !== folderId)
    
    // Delete all subfolders recursively
    const subfolders = folders.value.filter(f => f.parentId === folderId)
    subfolders.forEach(subfolder => deleteFolder(subfolder.id))
    
    // Delete the folder itself
    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      folders.value.splice(index, 1)
    }
  }

  // CRUD operations for files
  function createFile(fileData) {
    const now = new Date()
    const filesInFolder = files.value.filter(f => f.folderId === fileData.folderId)
    const nextOrderIndex = filesInFolder.length
    const nextItemOrder = filesInFolder.reduce((max, file) => Math.max(max, file.itemOrder || 0), -1) + 1
    
    const newFile = {
      id: `file_${Date.now()}`,
      name: fileData.name,
      folderId: fileData.folderId,
      orderIndex: fileData.orderIndex ?? nextOrderIndex,
      itemOrder: fileData.itemOrder ?? nextItemOrder,
      fileType: fileData.fileType || 'video',
      metadata: fileData.metadata || {},
      createdAt: now,
      updatedAt: now
    }
    files.value.push(newFile)
    return newFile
  }

  function updateFile(fileId, updates) {
    const index = files.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      files.value[index] = {
        ...files.value[index],
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  function deleteFile(fileId) {
    const index = files.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      files.value.splice(index, 1)
    }
  }

  // Unified move operation for mixed folder/file ordering
  function moveItem(itemId, itemType, targetParentId, targetIndex = null) {
    const now = new Date()
    
    // Get all items at the target location
    const targetItems = getItemsByParent.value(targetParentId)
    
    if (itemType === 'folder') {
      const folder = folders.value.find(f => f.id === itemId)
      if (!folder) return
      
      const oldParentId = folder.parentId
      
      // Update parent
      folder.parentId = targetParentId
      folder.updatedAt = now
      
      // Calculate new itemOrder
      if (targetIndex !== null && targetIndex <= targetItems.length) {
        // Insert at specific position
        folder.itemOrder = targetIndex
        
        // Update itemOrder for items after the insertion point
        targetItems.forEach(item => {
          if (item.itemOrder >= targetIndex && item.id !== itemId) {
            if (item.type === 'folder') {
              const f = folders.value.find(fold => fold.id === item.id)
              if (f) {
                f.itemOrder += 1
                f.updatedAt = now
              }
            } else {
              const f = files.value.find(file => file.id === item.id)
              if (f) {
                f.itemOrder += 1
                f.updatedAt = now
              }
            }
          }
        })
      } else {
        // Add to end
        folder.itemOrder = targetItems.length
      }
      
      // Reorder items at the old location if moved between parents
      if (oldParentId !== targetParentId) {
        reorderItemsInParent(oldParentId)
      }
    } else {
      // Handle file move
      const file = files.value.find(f => f.id === itemId)
      if (!file) return
      
      const oldFolderId = file.folderId
      
      // Update folder
      file.folderId = targetParentId
      file.updatedAt = now
      
      // Calculate new itemOrder
      if (targetIndex !== null && targetIndex <= targetItems.length) {
        // Insert at specific position
        file.itemOrder = targetIndex
        
        // Update itemOrder for items after the insertion point
        targetItems.forEach(item => {
          if (item.itemOrder >= targetIndex && item.id !== itemId) {
            if (item.type === 'folder') {
              const f = folders.value.find(fold => fold.id === item.id)
              if (f) {
                f.itemOrder += 1
                f.updatedAt = now
              }
            } else {
              const f = files.value.find(fil => fil.id === item.id)
              if (f) {
                f.itemOrder += 1
                f.updatedAt = now
              }
            }
          }
        })
      } else {
        // Add to end
        file.itemOrder = targetItems.length
      }
      
      // Reorder items at the old location if moved between folders
      if (oldFolderId !== targetParentId) {
        reorderItemsInParent(oldFolderId)
      }
    }
  }
  
  // Helper function to reorder items in a parent after removal
  function reorderItemsInParent(parentId) {
    const items = getItemsByParent.value(parentId)
    const now = new Date()
    
    items.forEach((item, index) => {
      if (item.type === 'folder') {
        const folder = folders.value.find(f => f.id === item.id)
        if (folder && folder.itemOrder !== index) {
          folder.itemOrder = index
          folder.updatedAt = now
        }
      } else {
        const file = files.value.find(f => f.id === item.id)
        if (file && file.itemOrder !== index) {
          file.itemOrder = index
          file.updatedAt = now
        }
      }
    })
  }

  // Move operations (keep for backward compatibility but use moveItem internally)
  function moveFile(fileId, newFolderId, newIndex = null) {
    const file = files.value.find(f => f.id === fileId)
    if (!file) return

    const oldFolderId = file.folderId
    
    // Get all files in the target folder except the one being moved
    const targetFolderFiles = files.value
      .filter(f => f.folderId === newFolderId && f.id !== fileId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Set the file's new folder
    file.folderId = newFolderId
    file.updatedAt = new Date()
    
    // Reorder the target folder
    if (newIndex !== null && newIndex <= targetFolderFiles.length) {
      // Insert at specific position
      targetFolderFiles.forEach((f, idx) => {
        if (idx >= newIndex) {
          f.orderIndex = idx + 1
          f.updatedAt = new Date()
        } else {
          f.orderIndex = idx
        }
      })
      file.orderIndex = newIndex
    } else {
      // Add to end
      file.orderIndex = targetFolderFiles.length
    }
    
    // If we moved from a different folder, reorder the old folder
    if (oldFolderId !== newFolderId) {
      const oldFolderFiles = files.value
        .filter(f => f.folderId === oldFolderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      oldFolderFiles.forEach((f, index) => {
        f.orderIndex = index
        f.updatedAt = new Date()
      })
    }
  }

  function moveFolder(folderId, newParentId, newIndex = null) {
    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return

    const oldParentId = folder.parentId
    
    // Update parent
    folder.parentId = newParentId
    folder.updatedAt = new Date()
    
    // Get all folders at the target level except the one being moved
    const targetLevelFolders = folders.value
      .filter(f => f.parentId === newParentId && f.id !== folderId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Reorder the target level
    if (newIndex !== null && newIndex <= targetLevelFolders.length) {
      // Insert at specific position
      targetLevelFolders.forEach((f, idx) => {
        if (idx >= newIndex) {
          f.orderIndex = idx + 1
          f.updatedAt = new Date()
        } else {
          f.orderIndex = idx
        }
      })
      folder.orderIndex = newIndex
    } else {
      // Add to end
      folder.orderIndex = targetLevelFolders.length
    }
    
    // If we moved from a different parent, reorder the old level
    if (oldParentId !== newParentId) {
      const oldLevelFolders = folders.value
        .filter(f => f.parentId === oldParentId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      oldLevelFolders.forEach((f, index) => {
        f.orderIndex = index
        f.updatedAt = new Date()
      })
    }
  }

  // Temporary removal and restoration (for drag and drop)
  function temporarilyRemoveFile(fileId) {
    const index = files.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      files.value.splice(index, 1)
    }
  }

  function restoreFile(file, folderId, targetIndex) {
    // Check if file already exists to prevent duplicates
    const exists = files.value.find(f => f.id === file.id)
    if (!exists) {
      // Add the file back to the array first
      files.value.push(file)
    }
    
    // Then use moveFile to position it correctly
    moveFile(file.id, folderId, targetIndex)
  }

  function temporarilyRemoveFolder(folderId) {
    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      folders.value.splice(index, 1)
    }
  }

  function restoreFolder(folder, parentId, targetIndex) {
    // Check if folder already exists to prevent duplicates
    const exists = folders.value.find(f => f.id === folder.id)
    if (!exists) {
      // Add the folder back to the array first
      folders.value.push(folder)
    }
    
    // Then use moveFolder to position it correctly
    moveFolder(folder.id, parentId, targetIndex)
  }

  return {
    // Data
    folders,
    files,
    uiState,
    
    // Computed queries
    allFolders,
    rootFolders,
    getFoldersByParent,
    allFiles,
    getFilesByFolder,
    getFileById,
    getFolderById,
    getItemsByParent,
    
    // UI State methods
    toggleFolder,
    expandFolder,
    collapseFolder,
    isExpanded,
    setSelectedItem,
    clearSelection,
    
    // CRUD operations
    createFolder,
    updateFolder,
    deleteFolder,
    createFile,
    updateFile,
    deleteFile,
    
    // Move operations
    moveItem,
    moveFile,
    moveFolder,
    reorderItemsInParent,
    
    // Temporary operations (for drag and drop)
    temporarilyRemoveFile,
    restoreFile,
    temporarilyRemoveFolder,
    restoreFolder
  }
})