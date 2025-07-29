import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { apiService } from '../services/api'
import { useUserStore } from './user'

export const useProjectsStore = defineStore('projects', () => {
  // Loading states
  const isLoadingProjects = ref(false)
  const isLoadingContent = ref(false)
  
  // Projects list
  const projects = ref([
    { 
      id: 'proj1', 
      name: 'Marketing Campaign 2024',
      videoCount: 12,
      lastModified: new Date('2024-01-20'),
      color: 'cyan'
    },
    { 
      id: 'proj2', 
      name: 'Product Demos',
      videoCount: 8,
      lastModified: new Date('2024-01-18'),
      color: 'purple'
    },
    { 
      id: 'proj3', 
      name: 'Customer Testimonials',
      videoCount: 15,
      lastModified: new Date('2024-01-19'),
      color: 'green'
    },
    { 
      id: 'proj4', 
      name: 'Training Videos',
      videoCount: 24,
      lastModified: new Date('2024-01-17'),
      color: 'orange'
    },
    { 
      id: 'proj5', 
      name: 'Social Media Content',
      videoCount: 31,
      lastModified: new Date('2024-01-21'),
      color: 'pink'
    }
  ])

  // Currently selected project
  const selectedProjectId = ref('proj1')

  // Folders for each project
  const folders = ref([
    // Marketing Campaign 2024
    { id: 'folder1', name: '01_Brand_Awareness', projectId: 'proj1', orderIndex: 0 },
    { id: 'folder2', name: '02_Product_Launch', projectId: 'proj1', orderIndex: 1 },
    { id: 'folder3', name: '03_Holiday_Campaign', projectId: 'proj1', orderIndex: 2 },
    { id: 'folder4', name: 'Archive', projectId: 'proj1', orderIndex: 3 },
    
    // Product Demos
    { id: 'folder5', name: 'Feature_Overviews', projectId: 'proj2', orderIndex: 0 },
    { id: 'folder6', name: 'Mobile_App', projectId: 'proj2', orderIndex: 1 },
    { id: 'folder7', name: 'Integration_Guides', projectId: 'proj2', orderIndex: 2 },
    
    // Customer Testimonials
    { id: 'folder8', name: 'Enterprise_Clients', projectId: 'proj3', orderIndex: 0 },
    { id: 'folder9', name: 'Small_Business', projectId: 'proj3', orderIndex: 1 },
    { id: 'folder10', name: 'Case_Studies', projectId: 'proj3', orderIndex: 2 },
    
    // Training Videos
    { id: 'folder11', name: 'Onboarding', projectId: 'proj4', orderIndex: 0 },
    { id: 'folder12', name: 'Advanced_Features', projectId: 'proj4', orderIndex: 1 },
    { id: 'folder13', name: 'Best_Practices', projectId: 'proj4', orderIndex: 2 },
    { id: 'folder14', name: 'Troubleshooting', projectId: 'proj4', orderIndex: 3 },
    
    // Social Media Content
    { id: 'folder15', name: 'Instagram_Reels', projectId: 'proj5', orderIndex: 0 },
    { id: 'folder16', name: 'YouTube_Shorts', projectId: 'proj5', orderIndex: 1 },
    { id: 'folder17', name: 'TikTok', projectId: 'proj5', orderIndex: 2 },
    { id: 'folder18', name: 'LinkedIn', projectId: 'proj5', orderIndex: 3 }
  ])

  // File system structure (folders and videos mixed)
  const fileSystem = ref([
    // Marketing Campaign 2024 - Root level items
    { id: 'fs1', type: 'folder', name: 'Raw_Footage', parentId: null, projectId: 'proj1', orderIndex: 0 },
    { id: 'fs2', type: 'folder', name: 'Edited_Videos', parentId: null, projectId: 'proj1', orderIndex: 1 },
    { id: 'fs3', type: 'folder', name: 'Graphics_Assets', parentId: null, projectId: 'proj1', orderIndex: 2 },
    { id: 'fs4', type: 'video', name: 'Campaign_Overview.mp4', parentId: null, projectId: 'proj1', orderIndex: 3, duration: '3:45', size: '450 MB', status: 'ready' },
    
    // Nested folders
    { id: 'fs5', type: 'folder', name: 'Interviews', parentId: 'fs1', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs6', type: 'folder', name: 'B-Roll', parentId: 'fs1', projectId: 'proj1', orderIndex: 1 },
    { id: 'fs7', type: 'folder', name: 'Final_Exports', parentId: 'fs2', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs8', type: 'folder', name: 'Work_In_Progress', parentId: 'fs2', projectId: 'proj1', orderIndex: 1 },
    
    // Videos in folders
    // Interviews folder (fs5) - 5 videos
    { id: 'fs9', type: 'video', name: 'CEO_Interview_Raw.mp4', parentId: 'fs5', projectId: 'proj1', orderIndex: 0, duration: '15:32', size: '1.2 GB', status: 'processing', progress: 67 },
    { id: 'fs10', type: 'video', name: 'CTO_Interview_Raw.mp4', parentId: 'fs5', projectId: 'proj1', orderIndex: 1, duration: '12:18', size: '980 MB', status: 'processing', progress: 23 },
    { id: 'fs40', type: 'video', name: 'CFO_Interview_Raw.mp4', parentId: 'fs5', projectId: 'proj1', orderIndex: 2, duration: '10:45', size: '850 MB', status: 'ready' },
    { id: 'fs41', type: 'video', name: 'Product_Manager_Interview.mp4', parentId: 'fs5', projectId: 'proj1', orderIndex: 3, duration: '14:20', size: '1.1 GB', status: 'ready' },
    { id: 'fs42', type: 'video', name: 'Lead_Designer_Interview.mp4', parentId: 'fs5', projectId: 'proj1', orderIndex: 4, duration: '11:15', size: '920 MB', status: 'ready' },
    
    // B-Roll folder (fs6) - 4 videos
    { id: 'fs11', type: 'video', name: 'Office_Tour_B-Roll.mp4', parentId: 'fs6', projectId: 'proj1', orderIndex: 0, duration: '8:45', size: '750 MB', status: 'queued' },
    { id: 'fs12', type: 'video', name: 'Product_Shots.mp4', parentId: 'fs6', projectId: 'proj1', orderIndex: 1, duration: '6:20', size: '520 MB', status: 'failed', error: 'Invalid video codec' },
    { id: 'fs43', type: 'video', name: 'Team_Collaboration.mp4', parentId: 'fs6', projectId: 'proj1', orderIndex: 2, duration: '5:30', size: '450 MB', status: 'ready' },
    { id: 'fs44', type: 'video', name: 'Workspace_Footage.mp4', parentId: 'fs6', projectId: 'proj1', orderIndex: 3, duration: '7:15', size: '620 MB', status: 'ready' },
    
    // Final_Exports folder (fs7) - 3 videos
    { id: 'fs13', type: 'video', name: 'Campaign_Final_1080p.mp4', parentId: 'fs7', projectId: 'proj1', orderIndex: 0, duration: '2:30', size: '180 MB', status: 'ready' },
    { id: 'fs14', type: 'video', name: 'Campaign_Final_4K.mp4', parentId: 'fs7', projectId: 'proj1', orderIndex: 1, duration: '2:30', size: '680 MB', status: 'ready' },
    { id: 'fs45', type: 'video', name: 'Campaign_Final_Social_Cut.mp4', parentId: 'fs7', projectId: 'proj1', orderIndex: 2, duration: '1:00', size: '120 MB', status: 'ready' },
    
    // Work_In_Progress folder (fs8) - 3 videos
    { id: 'fs46', type: 'video', name: 'Draft_v1.mp4', parentId: 'fs8', projectId: 'proj1', orderIndex: 0, duration: '2:45', size: '220 MB', status: 'ready' },
    { id: 'fs47', type: 'video', name: 'Draft_v2_with_music.mp4', parentId: 'fs8', projectId: 'proj1', orderIndex: 1, duration: '2:35', size: '240 MB', status: 'ready' },
    { id: 'fs48', type: 'video', name: 'Draft_v3_color_corrected.mp4', parentId: 'fs8', projectId: 'proj1', orderIndex: 2, duration: '2:30', size: '250 MB', status: 'ready' },
    
    // Product Demos - Root level
    { id: 'fs15', type: 'folder', name: 'Screen_Recordings', parentId: null, projectId: 'proj2', orderIndex: 0 },
    { id: 'fs16', type: 'folder', name: 'Voiceovers', parentId: null, projectId: 'proj2', orderIndex: 1 },
    { id: 'fs17', type: 'video', name: 'Intro_Animation.mp4', parentId: null, projectId: 'proj2', orderIndex: 2, duration: '0:08', size: '25 MB' },
    
    // Videos in Product Demos folders
    { id: 'fs18', type: 'video', name: 'Dashboard_Demo.mp4', parentId: 'fs15', projectId: 'proj2', orderIndex: 0, duration: '5:45', size: '380 MB' },
    { id: 'fs19', type: 'video', name: 'Feature_Walkthrough.mp4', parentId: 'fs15', projectId: 'proj2', orderIndex: 1, duration: '8:20', size: '520 MB' },
    { id: 'fs20', type: 'video', name: 'Voiceover_English.mp4', parentId: 'fs16', projectId: 'proj2', orderIndex: 0, duration: '8:20', size: '45 MB' },
    
    // Customer Testimonials
    { id: 'fs21', type: 'folder', name: 'Raw_Interviews', parentId: null, projectId: 'proj3', orderIndex: 0 },
    { id: 'fs22', type: 'folder', name: 'Edited_Testimonials', parentId: null, projectId: 'proj3', orderIndex: 1 },
    { id: 'fs23', type: 'video', name: 'Compilation_Reel.mp4', parentId: null, projectId: 'proj3', orderIndex: 2, duration: '4:30', size: '320 MB' },
    
    // Training Videos
    { id: 'fs24', type: 'folder', name: 'Module_1_Basics', parentId: null, projectId: 'proj4', orderIndex: 0 },
    { id: 'fs25', type: 'folder', name: 'Module_2_Advanced', parentId: null, projectId: 'proj4', orderIndex: 1 },
    { id: 'fs26', type: 'folder', name: 'Module_3_Expert', parentId: null, projectId: 'proj4', orderIndex: 2 },
    
    // Social Media Content
    { id: 'fs27', type: 'folder', name: 'Instagram', parentId: null, projectId: 'proj5', orderIndex: 0 },
    { id: 'fs28', type: 'folder', name: 'TikTok', parentId: null, projectId: 'proj5', orderIndex: 1 },
    { id: 'fs29', type: 'folder', name: 'YouTube_Shorts', parentId: null, projectId: 'proj5', orderIndex: 2 },
    
    // Test deeply nested structure for Marketing Campaign
    { id: 'fs30', type: 'folder', name: 'Archive', parentId: null, projectId: 'proj1', orderIndex: 4 },
    { id: 'fs31', type: 'folder', name: '2023', parentId: 'fs30', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs32', type: 'folder', name: 'Q4', parentId: 'fs31', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs33', type: 'folder', name: 'December', parentId: 'fs32', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs34', type: 'folder', name: 'Week_4', parentId: 'fs33', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs35', type: 'folder', name: 'Finals', parentId: 'fs34', projectId: 'proj1', orderIndex: 0 },
    { id: 'fs36', type: 'video', name: 'Final_v1.mp4', parentId: 'fs35', projectId: 'proj1', orderIndex: 0, duration: '2:30', size: '200 MB' },
    { id: 'fs37', type: 'video', name: 'Final_v2.mp4', parentId: 'fs35', projectId: 'proj1', orderIndex: 1, duration: '2:32', size: '210 MB' },
    { id: 'fs38', type: 'folder', name: 'Approved', parentId: 'fs35', projectId: 'proj1', orderIndex: 2 },
    { id: 'fs39', type: 'video', name: 'Final_approved.mp4', parentId: 'fs38', projectId: 'proj1', orderIndex: 0, duration: '2:30', size: '205 MB' }
  ])

  // Videos
  const videos = ref([
    // Marketing Campaign - Brand Awareness
    {
      id: 'vid1',
      name: 'Brand Story 60s.mp4',
      folderId: 'folder1',
      orderIndex: 0,
      duration: '1:00',
      size: '125 MB',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'vid2',
      name: 'Brand Story 30s.mp4',
      folderId: 'folder1',
      orderIndex: 1,
      duration: '0:30',
      size: '68 MB',
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'vid3',
      name: 'Mission Statement.mp4',
      folderId: 'folder1',
      orderIndex: 2,
      duration: '2:15',
      size: '210 MB',
      createdAt: new Date('2024-01-16')
    },
    
    // Marketing Campaign - Product Launch
    {
      id: 'vid4',
      name: 'Product Reveal Teaser.mp4',
      folderId: 'folder2',
      orderIndex: 0,
      duration: '0:15',
      size: '45 MB',
      createdAt: new Date('2024-01-17')
    },
    {
      id: 'vid5',
      name: 'Launch Event Highlights.mp4',
      folderId: 'folder2',
      orderIndex: 1,
      duration: '3:45',
      size: '380 MB',
      createdAt: new Date('2024-01-18')
    },
    
    // Product Demos - Feature Overviews
    {
      id: 'vid6',
      name: 'Dashboard Overview.mp4',
      folderId: 'folder5',
      orderIndex: 0,
      duration: '5:20',
      size: '450 MB',
      createdAt: new Date('2024-01-10')
    },
    {
      id: 'vid7',
      name: 'Analytics Features.mp4',
      folderId: 'folder5',
      orderIndex: 1,
      duration: '4:15',
      size: '380 MB',
      createdAt: new Date('2024-01-11')
    },
    {
      id: 'vid8',
      name: 'Reporting Tools.mp4',
      folderId: 'folder5',
      orderIndex: 2,
      duration: '3:30',
      size: '320 MB',
      createdAt: new Date('2024-01-12')
    },
    
    // Social Media - Instagram Reels
    {
      id: 'vid9',
      name: 'Quick Tip #1.mp4',
      folderId: 'folder15',
      orderIndex: 0,
      duration: '0:30',
      size: '25 MB',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'vid10',
      name: 'Quick Tip #2.mp4',
      folderId: 'folder15',
      orderIndex: 1,
      duration: '0:28',
      size: '23 MB',
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'vid11',
      name: 'Behind the Scenes.mp4',
      folderId: 'folder15',
      orderIndex: 2,
      duration: '0:45',
      size: '38 MB',
      createdAt: new Date('2024-01-21')
    }
  ])

  // Computed
  const selectedProject = computed(() => 
    projects.value.find(p => p.id === selectedProjectId.value)
  )

  const projectFolders = computed({
    get() {
      return folders.value
        .filter(f => f.projectId === selectedProjectId.value)
        .sort((a, b) => a.orderIndex - b.orderIndex)
    },
    set(newFolders) {
      // Update orderIndex when folders are reordered
      newFolders.forEach((folder, index) => {
        const originalFolder = folders.value.find(f => f.id === folder.id)
        if (originalFolder) {
          originalFolder.orderIndex = index
        }
      })
    }
  })

  const getVideosByFolder = (folderId) => {
    return videos.value
      .filter(v => v.folderId === folderId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const getVideoCount = (projectId) => {
    const projectFolderIds = folders.value
      .filter(f => f.projectId === projectId)
      .map(f => f.id)
    
    return videos.value.filter(v => projectFolderIds.includes(v.folderId)).length
  }

  // Actions
  const selectProject = (projectId) => {
    selectedProjectId.value = projectId
  }

  const moveVideo = (videoId, newFolderId, newIndex = null) => {
    const video = videos.value.find(v => v.id === videoId)
    if (!video) return

    const oldFolderId = video.folderId
    
    // Update folder
    video.folderId = newFolderId
    
    // Reorder videos in the new folder
    if (newIndex !== null) {
      const folderVideos = videos.value
        .filter(v => v.folderId === newFolderId && v.id !== videoId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      // Insert at specific position
      folderVideos.splice(newIndex, 0, video)
      
      // Update order indexes
      folderVideos.forEach((v, idx) => {
        v.orderIndex = idx
      })
    } else {
      // Add to end
      const maxIndex = Math.max(...videos.value
        .filter(v => v.folderId === newFolderId)
        .map(v => v.orderIndex), -1)
      video.orderIndex = maxIndex + 1
    }
    
    // Reorder old folder if different
    if (oldFolderId !== newFolderId) {
      const oldFolderVideos = videos.value
        .filter(v => v.folderId === oldFolderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      oldFolderVideos.forEach((v, idx) => {
        v.orderIndex = idx
      })
    }
  }

  const moveFolder = (folderId, newIndex) => {
    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return

    const projectFolders = folders.value
      .filter(f => f.projectId === folder.projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    
    const oldIndex = projectFolders.findIndex(f => f.id === folderId)
    if (oldIndex === newIndex) return
    
    // Remove from old position
    projectFolders.splice(oldIndex, 1)
    
    // Insert at new position
    projectFolders.splice(newIndex, 0, folder)
    
    // Update order indexes
    projectFolders.forEach((f, idx) => {
      f.orderIndex = idx
    })
  }

  // File system methods
  const getProjectFileSystem = (projectId) => {
    if (!projectId) return []
    
    return fileSystem.value
      .filter(item => item.projectId === projectId && item.parentId === null)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const updateFileParent = (itemId, itemType, newParentId, newIndex) => {
    const item = fileSystem.value.find(i => i.id === itemId)
    if (!item) return
    
    // Preserve the original type
    const originalType = item.type
    
    // Update parent
    item.parentId = newParentId
    
    // Ensure type is preserved
    item.type = originalType
    
    // Reorder siblings at the new location
    const siblings = fileSystem.value
      .filter(i => i.parentId === newParentId && i.id !== itemId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Update order indexes
    if (newIndex !== undefined && newIndex !== null) {
      siblings.splice(newIndex, 0, item)
      siblings.forEach((sibling, idx) => {
        sibling.orderIndex = idx
      })
    } else {
      // Add to end if no index specified
      item.orderIndex = siblings.length
    }
  }

  const getVideosInFolder = (folderId) => {
    return fileSystem.value
      .filter(item => item.type === 'video' && item.parentId === folderId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const getFolderVideoCount = (folderId) => {
    // Count direct videos
    let count = fileSystem.value.filter(item => 
      item.type === 'video' && item.parentId === folderId
    ).length
    
    // Count videos in subfolders
    const subfolders = fileSystem.value.filter(item => 
      item.type === 'folder' && item.parentId === folderId
    )
    
    subfolders.forEach(subfolder => {
      count += getFolderVideoCount(subfolder.id)
    })
    
    return count
  }

  const debugFileSystem = () => {
    console.log('=== FILE SYSTEM DEBUG ===')
    fileSystem.value.forEach(item => {
      console.log(`ID: ${item.id}, Type: ${item.type}, Name: ${item.name}, Parent: ${item.parentId}`)
    })
    console.log('========================')
  }

  const moveFileSystemItem = async (itemId, newParentId) => {
    const itemIndex = fileSystem.value.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return false
    
    const item = fileSystem.value[itemIndex]
    
    // Don't allow moving to same parent
    if (item.parentId === newParentId) return false
    
    // Store the original parent for rollback
    const originalParentId = item.parentId
    const originalOrderIndex = item.orderIndex
    
    // Create a completely new array to ensure Vue reactivity
    const newFileSystem = fileSystem.value.map((fsItem, index) => {
      if (index === itemIndex) {
        // This is the item we're moving - create a new object
        return {
          ...fsItem,
          parentId: newParentId,
          // Preserve all other properties explicitly
          id: fsItem.id,
          type: fsItem.type,
          name: fsItem.name,
          projectId: fsItem.projectId,
          duration: fsItem.duration,
          size: fsItem.size,
          orderIndex: 0 // Will be updated below
        }
      }
      return fsItem
    })
    
    // Update order indexes for siblings at the new location
    const siblings = newFileSystem
      .filter(i => i.parentId === newParentId && i.id !== itemId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Find the moved item in the new array
    const movedItem = newFileSystem.find(i => i.id === itemId)
    if (movedItem) {
      movedItem.orderIndex = siblings.length
    }
    
    // Optimistically update the UI
    fileSystem.value = newFileSystem
    
    console.log(`Moved item ${itemId} (type: ${item.type}) to parent ${newParentId}`)
    
    try {
      // Make server call based on item type
      if (item.type === 'folder') {
        await apiService.updateFolder(itemId, { parentId: newParentId })
      } else if (item.type === 'video') {
        await apiService.updateVideo(itemId, { folderId: newParentId })
      }
      
      return true
    } catch (error) {
      console.error(`Failed to move ${item.type} on server:`, error)
      
      // Rollback - restore to original position
      const rollbackFileSystem = fileSystem.value.map((fsItem) => {
        if (fsItem.id === itemId) {
          return {
            ...fsItem,
            parentId: originalParentId,
            orderIndex: originalOrderIndex
          }
        }
        return fsItem
      })
      
      fileSystem.value = rollbackFileSystem
      
      // Show error to user
      alert(`Failed to move ${item.type}. Please try again.`)
      
      return false
    }
  }

  // ========== Server Data Hydration ==========
  
  /**
   * Hydrate projects from server data
   */
  const hydrateProjects = (serverProjects) => {
    projects.value = serverProjects.map(project => ({
      id: project.id,
      name: project.name,
      videoCount: project.videoCount || 0,
      lastModified: new Date(project.lastModified),
      color: project.color || 'cyan'
    }))
  }
  
  /**
   * Hydrate project content (folders and videos) from server
   */
  const hydrateProjectContent = (projectId, content) => {
    // Clear existing content for this project
    fileSystem.value = fileSystem.value.filter(item => item.projectId !== projectId)
    
    // Add folders
    if (content.folders) {
      content.folders.forEach(folder => {
        fileSystem.value.push({
          id: folder.id,
          type: 'folder',
          name: folder.name,
          parentId: folder.parentId || null,
          projectId: projectId,
          orderIndex: folder.orderIndex || 0
        })
      })
    }
    
    // Add videos
    if (content.videos) {
      content.videos.forEach(video => {
        fileSystem.value.push({
          id: video.id,
          type: 'video',
          name: video.name,
          parentId: video.folderId || null,
          projectId: projectId,
          orderIndex: video.orderIndex || 0,
          duration: video.duration,
          size: video.size,
          status: video.status || 'ready',
          progress: video.progress
        })
      })
    }
  }
  
  /**
   * Load project content from server
   */
  const loadProject = async (projectId) => {
    try {
      isLoadingContent.value = true
      const content = await apiService.getProjectContent(projectId)
      hydrateProjectContent(projectId, content)
    } catch (error) {
      console.error('Failed to load project content:', error)
      // Continue with existing local data
    } finally {
      isLoadingContent.value = false
    }
  }

  return {
    // State
    projects,
    selectedProjectId,
    folders,
    videos,
    fileSystem,
    isLoadingProjects,
    isLoadingContent,
    
    // Computed
    selectedProject,
    projectFolders,
    
    // Methods
    selectProject,
    getVideosByFolder,
    getVideoCount,
    moveVideo,
    moveFolder,
    
    // File system methods
    getProjectFileSystem,
    updateFileParent,
    getVideosInFolder,
    getFolderVideoCount,
    moveFileSystemItem,
    debugFileSystem,
    
    // Server hydration
    hydrateProjects,
    hydrateProjectContent,
    loadProject
  }
})