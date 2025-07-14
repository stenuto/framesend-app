import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFileExplorerStore = defineStore('fileExplorer', () => {
  // Folders table
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

  // Files table
  const files = ref([
    // Root level video
    {
      id: 'vid13',
      name: 'Welcome Video.mp4',
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
    },
    // Marketing Campaign 2024
    {
      id: 'vid1',
      name: 'Brand Awareness Video.mp4',
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
      name: 'Product Launch Teaser.mp4',
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
      name: 'Old Introduction Video.mp4',
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
      name: 'Deprecated Welcome Message.mp4',
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
      name: 'Customer Success Story.mp4',
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
      name: 'Social Media Ad - Version A.mp4',
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
      name: 'Behind the Scenes - Making Of.mp4',
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
      name: 'Company Culture Video.mp4',
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
    // Another root level video
    {
      id: 'vid14',
      name: 'Quick Start Guide.mp4',
      folderId: null,
      orderIndex: 1,
      itemOrder: 9,
      fileType: 'video',
      metadata: {
        thumbnail: 'https://placehold.co/640x360',
        assignees: [
          { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
        ],
        labels: ['2'],
        duration: '1:45'
      },
      createdAt: new Date('2024-01-26'),
      updatedAt: new Date('2024-01-26')
    }
  ])

  // Move operations
  function moveFile(fileId, newFolderId, newIndex = null) {
    const file = files.value.find(f => f.id === fileId)
    if (!file) return

    const oldFolderId = file.folderId
    
    // Update folder
    file.folderId = newFolderId
    file.updatedAt = new Date()
    
    // Reorder if index provided
    if (newIndex !== null) {
      const targetFiles = files.value
        .filter(f => f.folderId === newFolderId && f.id !== fileId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      targetFiles.forEach((f, idx) => {
        if (idx >= newIndex) {
          f.orderIndex = idx + 1
        }
      })
      file.orderIndex = newIndex
    }
  }

  function moveFolder(folderId, newParentId, newIndex = null) {
    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return

    // Update parent
    folder.parentId = newParentId
    folder.updatedAt = new Date()
    
    // Reorder if index provided
    if (newIndex !== null) {
      const targetFolders = folders.value
        .filter(f => f.parentId === newParentId && f.id !== folderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      targetFolders.forEach((f, idx) => {
        if (idx >= newIndex) {
          f.orderIndex = idx + 1
        }
      })
      folder.orderIndex = newIndex
    }
  }

  return {
    folders,
    files,
    moveFile,
    moveFolder
  }
})