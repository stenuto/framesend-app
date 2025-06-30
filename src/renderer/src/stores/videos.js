import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVideosStore = defineStore('videos', () => {
  const videos = ref([
    // Marketing Campaign 2024
    {
      id: 'vid1',
      projectId: 'proj1',
      listId: 'list1',
      order: 0,
      title: 'Brand Awareness Video',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' }
      ],
      labels: ['1', '2'],
      duration: '2:45',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'vid2',
      projectId: 'proj1',
      listId: 'list1',
      order: 1,
      title: 'Product Launch Teaser',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
      ],
      labels: ['4'],
      duration: '0:30',
      createdAt: new Date('2024-01-16')
    },
    {
      id: 'vid2-archived-1',
      projectId: 'proj1',
      listId: 'list1-archived',
      order: 0,
      title: 'Old Introduction Video',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [],
      labels: ['4'],
      duration: '2:15',
      createdAt: new Date('2023-12-01')
    },
    {
      id: 'vid2-archived-2',
      projectId: 'proj1',
      listId: 'list1-archived',
      order: 1,
      title: 'Deprecated Welcome Message',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [],
      labels: ['2'],
      duration: '1:30',
      createdAt: new Date('2023-11-15')
    },
    {
      id: 'vid3',
      projectId: 'proj1',
      listId: 'list2',
      order: 0,
      title: 'Customer Success Story',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' },
        { id: 'user3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/100?img=8' }
      ],
      labels: ['3'],
      duration: '5:12',
      createdAt: new Date('2024-01-17')
    },
    {
      id: 'vid4',
      projectId: 'proj1',
      listId: 'list3',
      order: 0,
      title: 'Social Media Ad - Version A',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
      ],
      labels: ['5', '3'],
      duration: '0:15',
      createdAt: new Date('2024-01-18')
    },
    {
      id: 'vid7',
      projectId: 'proj1',
      listId: 'list1',
      order: 2,
      title: 'Behind the Scenes - Making Of',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/100?img=8' }
      ],
      labels: ['6'],
      duration: '3:20',
      createdAt: new Date('2024-01-19')
    },
    {
      id: 'vid8',
      projectId: 'proj1',
      listId: 'list2',
      order: 1,
      title: 'Company Culture Video',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' },
        { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' }
      ],
      labels: ['2', '3'],
      duration: '4:15',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'vid9',
      projectId: 'proj1',
      listId: 'list1',
      order: 3,
      title: 'Holiday Campaign Promo',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' }
      ],
      labels: ['1', '4'],
      duration: '1:00',
      createdAt: new Date('2024-01-21')
    },
    {
      id: 'vid10',
      projectId: 'proj1',
      listId: 'list3',
      order: 1,
      title: 'Email Campaign Video',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
      ],
      labels: ['7'],
      duration: '0:45',
      createdAt: new Date('2024-01-22')
    },
    {
      id: 'vid11',
      projectId: 'proj1',
      listId: 'list4',
      order: 0,
      title: 'Q4 Results Presentation',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user1', name: 'John Doe', avatar: 'https://i.pravatar.cc/100?img=3' },
        { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' }
      ],
      labels: ['7', '3'],
      duration: '12:30',
      createdAt: new Date('2024-01-23')
    },
    {
      id: 'vid12',
      projectId: 'proj1',
      listId: 'list2',
      order: 2,
      title: 'Instagram Reels - Product Feature',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/100?img=5' },
        { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
      ],
      labels: ['5', '6'],
      duration: '0:20',
      createdAt: new Date('2024-01-24')
    },
    // Product Demos
    {
      id: 'vid5',
      projectId: 'proj2',
      listId: 'list5',
      order: 0,
      title: 'Feature Overview 2024',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user4', name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/100?img=9' }
      ],
      labels: ['2'],
      duration: '8:30',
      createdAt: new Date('2024-01-10')
    },
    {
      id: 'vid6',
      projectId: 'proj2',
      listId: 'list6',
      order: 0,
      title: 'Mobile App Walkthrough',
      thumbnail: 'https://placehold.co/640x360',
      assignees: [
        { id: 'user5', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/100?img=12' }
      ],
      labels: ['4'],
      duration: '6:45',
      createdAt: new Date('2024-01-12')
    }
  ])

  const lists = ref([
    { id: 'list1', name: '01_Introduction', order: 0, projectId: 'proj1', parentId: null },
    { id: 'list1-archived', name: 'archived', order: 0, projectId: 'proj1', parentId: 'list1' },
    { id: 'list2', name: '02_Getting_Started', order: 1, projectId: 'proj1', parentId: null },
    { id: 'list3', name: '03_Core_Concepts', order: 2, projectId: 'proj1', parentId: null },
    { id: 'list4', name: '04_Advanced_Topics', order: 3, projectId: 'proj1', parentId: null },
    { id: 'list5', name: 'Module_1', order: 0, projectId: 'proj2', parentId: null },
    { id: 'list6', name: 'Module_2', order: 1, projectId: 'proj2', parentId: null },
    { id: 'list7', name: 'Module_3', order: 2, projectId: 'proj2', parentId: null },
    { id: 'list8', name: 'Bonus_Content', order: 3, projectId: 'proj2', parentId: null }
  ])

  const videosByProject = computed(() => {
    return (projectId) => videos.value.filter(v => v.projectId === projectId)
  })

  const videosByList = computed(() => {
    return (listId) => videos.value
      .filter(v => v.listId === listId)
      .sort((a, b) => a.order - b.order)
  })

  const listsByProject = computed(() => {
    return (projectId) => lists.value
      .filter(l => l.projectId === projectId)
      .sort((a, b) => a.order - b.order)
  })

  function moveVideo(videoId, newListId, newIndex = null) {
    const video = videos.value.find(v => v.id === videoId)
    if (!video) return

    const oldListId = video.listId
    
    // Get all videos in the target list except the one being moved
    const targetListVideos = videos.value
      .filter(v => v.listId === newListId && v.id !== videoId)
      .sort((a, b) => a.order - b.order)
    
    // Set the video's new list
    video.listId = newListId
    
    // Reorder the target list
    if (newIndex !== null && newIndex <= targetListVideos.length) {
      // Insert at specific position
      targetListVideos.forEach((v, idx) => {
        if (idx >= newIndex) {
          v.order = idx + 1
        } else {
          v.order = idx
        }
      })
      video.order = newIndex
    } else {
      // Add to end
      video.order = targetListVideos.length
    }
    
    // If we moved from a different list, reorder the old list
    if (oldListId !== newListId) {
      const oldListVideos = videos.value
        .filter(v => v.listId === oldListId)
        .sort((a, b) => a.order - b.order)
      
      oldListVideos.forEach((v, index) => {
        v.order = index
      })
    }
  }

  function addVideo(video) {
    videos.value.push({
      ...video,
      id: `vid${Date.now()}`,
      createdAt: new Date()
    })
  }

  function updateVideo(videoId, updates) {
    const index = videos.value.findIndex(v => v.id === videoId)
    if (index !== -1) {
      videos.value[index] = { ...videos.value[index], ...updates }
    }
  }

  function deleteVideo(videoId) {
    const index = videos.value.findIndex(v => v.id === videoId)
    if (index !== -1) {
      videos.value.splice(index, 1)
    }
  }

  function temporarilyRemoveVideo(videoId) {
    const index = videos.value.findIndex(v => v.id === videoId)
    if (index !== -1) {
      videos.value.splice(index, 1)
    }
  }

  function restoreVideo(video, listId, targetIndex) {
    // Check if video already exists to prevent duplicates
    const exists = videos.value.find(v => v.id === video.id)
    if (!exists) {
      // Add the video back to the array first
      videos.value.push(video)
    }
    
    // Then use moveVideo to position it correctly
    moveVideo(video.id, listId, targetIndex)
  }

  function moveList(listId, projectId, newIndex) {
    const list = lists.value.find(l => l.id === listId)
    if (!list) return

    // Get all lists in the project except the one being moved
    const projectLists = lists.value
      .filter(l => l.projectId === projectId && l.id !== listId)
      .sort((a, b) => a.order - b.order)
    
    // Set the list's project (in case it's moving between projects)
    list.projectId = projectId
    
    // Reorder the lists
    if (newIndex !== null && newIndex <= projectLists.length) {
      // Insert at specific position
      projectLists.forEach((l, idx) => {
        if (idx >= newIndex) {
          l.order = idx + 1
        } else {
          l.order = idx
        }
      })
      list.order = newIndex
    } else {
      // Add to end
      list.order = projectLists.length
    }
  }

  function temporarilyRemoveList(listId) {
    const index = lists.value.findIndex(l => l.id === listId)
    if (index !== -1) {
      lists.value.splice(index, 1)
    }
  }

  function restoreList(list, projectId, targetIndex) {
    // Check if list already exists to prevent duplicates
    const exists = lists.value.find(l => l.id === list.id)
    if (!exists) {
      // Add the list back to the array first
      lists.value.push(list)
    }
    
    // Then use moveList to position it correctly
    moveList(list.id, projectId, targetIndex)
  }

  return {
    videos,
    lists,
    videosByProject,
    videosByList,
    listsByProject,
    moveVideo,
    addVideo,
    updateVideo,
    deleteVideo,
    temporarilyRemoveVideo,
    restoreVideo,
    moveList,
    temporarilyRemoveList,
    restoreList
  }
})