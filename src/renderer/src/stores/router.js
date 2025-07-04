import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'

export const useRouterStore = defineStore('router', () => {
  // State
  const currentRoute = ref('upload')
  const history = ref(['upload'])
  const historyIndex = ref(0)
  const routes = ref(new Map())

  // Getters
  const canGoBack = computed(() => historyIndex.value > 0)
  const canGoForward = computed(() => historyIndex.value < history.value.length - 1)
  
  const baseRoute = computed(() => currentRoute.value.split('?')[0])
  
  const isSubPage = computed(() => baseRoute.value.includes('/'))
  
  const parentPage = computed(() => {
    if (!isSubPage.value) return null
    return baseRoute.value.split('/')[0]
  })
  
  const currentPage = computed(() => {
    return baseRoute.value.split('/')[0]
  })
  
  const currentSubPage = computed(() => {
    if (!isSubPage.value) return null
    return baseRoute.value.split('/')[1]
  })
  
  const currentComponent = computed(() => {
    // Extract base route from current route (remove params)
    const baseRoute = currentRoute.value.split('?')[0]
    return routes.value.get(baseRoute)?.component || null
  })
  
  const currentMeta = computed(() => {
    const base = currentRoute.value.split('?')[0]
    return routes.value.get(base)?.meta || {}
  })
  
  const currentParams = computed(() => {
    const paramMatch = currentRoute.value.match(/\?(.+)$/)
    if (paramMatch) {
      try {
        return JSON.parse(paramMatch[1])
      } catch {
        return {}
      }
    }
    return {}
  })
  
  const breadcrumbs = computed(() => {
    const crumbs = []
    
    // Add parent page if this is a sub-page
    if (isSubPage.value && parentPage.value) {
      const parentRoute = routes.value.get(parentPage.value)
      if (parentRoute) {
        crumbs.push({
          label: parentRoute.meta?.title || parentPage.value,
          route: parentPage.value
        })
      }
    }
    
    // Add current page
    const base = currentRoute.value.split('?')[0]
    const currentRouteConfig = routes.value.get(base)
    if (currentRouteConfig) {
      crumbs.push({
        label: currentRouteConfig.meta?.title || base,
        route: currentRoute.value,
        active: true
      })
    }
    
    return crumbs
  })

  // Actions
  function navigate(route, params = {}) {
    // Create a unique route key if params are provided
    const routeKey = Object.keys(params).length > 0 
      ? `${route}?${JSON.stringify(params)}`
      : route
    
    // Don't navigate to the same route with same params
    if (routeKey === currentRoute.value) return
    
    // Check if base route exists
    const baseRoute = route.split('?')[0]
    if (!routes.value.has(baseRoute)) {
      console.warn(`Route "${baseRoute}" not found`)
      return
    }
    
    // If we're not at the end of history, remove everything after current position
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    // Add new route to history with params
    history.value.push(routeKey)
    historyIndex.value = history.value.length - 1
    currentRoute.value = routeKey
  }
  
  function goBack() {
    if (!canGoBack.value) return
    
    historyIndex.value--
    currentRoute.value = history.value[historyIndex.value]
  }
  
  function goForward() {
    if (!canGoForward.value) return
    
    historyIndex.value++
    currentRoute.value = history.value[historyIndex.value]
  }
  
  function navigateTo(route, params = {}) {
    navigate(route, params)
  }
  
  function registerRoute(path, component, meta = {}) {
    routes.value.set(path, {
      path,
      component: markRaw(component),
      meta
    })
  }
  
  async function registerRoutes() {
    // Import all page components
    const pageModules = import.meta.glob('../pages/**/*.vue')
    
    for (const [filePath, importFn] of Object.entries(pageModules)) {
      // Extract route from file path
      // ../pages/dashboard/index.vue -> dashboard
      // ../pages/settings/index.vue -> settings
      // ../pages/settings/encoding.vue -> settings/encoding
      
      const pathMatch = filePath.match(/pages\/(.+)\.vue$/)
      if (!pathMatch) continue
      
      let route = pathMatch[1]
      
      // Convert index.vue to parent route
      if (route.endsWith('/index')) {
        route = route.slice(0, -6) // Remove '/index'
      }
      
      // Load the component
      const module = await importFn()
      const component = module.default
      
      // Extract meta from component
      const meta = component.meta || {}
      
      // Register the route
      registerRoute(route, component, meta)
    }
    
    // Ensure current route is valid
    if (!routes.value.has(currentRoute.value)) {
      console.warn(`Current route "${currentRoute.value}" not found, navigating to upload`)
      currentRoute.value = 'upload'
      history.value = ['upload']
      historyIndex.value = 0
    }
  }

  return {
    // State
    currentRoute,
    history,
    historyIndex,
    routes,
    
    // Getters
    canGoBack,
    canGoForward,
    baseRoute,
    isSubPage,
    parentPage,
    currentPage,
    currentSubPage,
    currentComponent,
    currentMeta,
    currentParams,
    breadcrumbs,
    
    // Actions
    navigate,
    navigateTo,
    goBack,
    goForward,
    registerRoute,
    registerRoutes
  }
})