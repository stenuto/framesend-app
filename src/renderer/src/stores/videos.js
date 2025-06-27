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
    { id: 'list1', name: 'To Do', order: 0, projectId: 'proj1' },
    { id: 'list2', name: 'In Progress', order: 1, projectId: 'proj1' },
    { id: 'list3', name: 'In Review', order: 2, projectId: 'proj1' },
    { id: 'list4', name: 'Done', order: 3, projectId: 'proj1' },
    { id: 'list5', name: 'To Do', order: 0, projectId: 'proj2' },
    { id: 'list6', name: 'In Progress', order: 1, projectId: 'proj2' },
    { id: 'list7', name: 'In Review', order: 2, projectId: 'proj2' },
    { id: 'list8', name: 'Done', order: 3, projectId: 'proj2' }
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
    restoreVideo
  }
})