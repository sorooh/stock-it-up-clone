/**
 * Stock It Up Clone Platform - Service Worker
 * عامل الخدمة لمنصة Stock It Up
 * 
 * This service worker enables Progressive Web App (PWA) functionality for the Stock It Up clone.
 * It provides offline capabilities, background sync, push notifications, and caching strategies
 * optimized for Dutch business users and marketplace integrations.
 * 
 * Features:
 * - Offline-first caching strategy
 * - Background synchronization for orders and inventory
 * - Push notifications in Dutch and Arabic
 * - Network-first strategy for real-time data
 * - Cache-first strategy for static assets
 * - Selective caching for business-critical endpoints
 * 
 * Architecture:
 * - Cache versioning and management
 * - Network fallback strategies
 * - Background sync for critical business operations
 * - Notification handling with multi-language support
 * - Performance optimization for marketplace data
 */

const CACHE_NAME = 'stock-it-up-v1.0.0';
const DYNAMIC_CACHE = 'stock-it-up-dynamic-v1.0.0';
const BACKGROUND_SYNC_TAG = 'stock-it-up-sync';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/static/css/main.css',
    '/static/js/welkom.js',
    '/static/js/main.js',
    '/static/images/logo.png',
    '/static/images/favicon.ico',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Business-critical endpoints for selective caching
const CRITICAL_ENDPOINTS = [
    '/api/orders/',
    '/api/products/',
    '/api/inventory/',
    '/api/channels/',
    '/api/sync-status/',
    '/welkom/',
    '/dashboard/'
];

// Network-first endpoints (real-time data)
const NETWORK_FIRST_ENDPOINTS = [
    '/api/orders/real-time/',
    '/api/inventory/levels/',
    '/api/notifications/',
    '/api/sync/',
    '/ws/',
    '/api/marketplaces/status/'
];

// ===== SERVICE WORKER INSTALLATION =====

self.addEventListener('install', (event) => {
    console.log('[SW] Installing Stock It Up Service Worker v1.0.0');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// ===== SERVICE WORKER ACTIVATION =====

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Stock It Up Service Worker');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old cache versions
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Cache cleanup completed');
                // Take control of all clients immediately
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[SW] Activation failed:', error);
            })
    );
});

// ===== FETCH HANDLER WITH CACHING STRATEGIES =====

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension URLs
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }

    // Determine caching strategy based on request
    if (isNetworkFirstEndpoint(url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (isCriticalEndpoint(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(staleWhileRevalidate(request));
    }
});

// ===== CACHING STRATEGIES =====

// Network-first strategy for real-time data
function networkFirst(request) {
    return fetch(request)
        .then((response) => {
            // Clone response for caching
            const responseClone = response.clone();
            
            if (response.status === 200) {
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                        cache.put(request, responseClone);
                    });
            }
            
            return response;
        })
        .catch(() => {
            // Fallback to cache if network fails
            return caches.match(request)
                .then((cached) => {
                    if (cached) {
                        console.log('[SW] Serving cached response for:', request.url);
                        return cached;
                    }
                    
                    // Return offline page for navigation requests
                    if (request.destination === 'document') {
                        return caches.match('/offline/');
                    }
                    
                    // Return a basic response for other requests
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
        });
}

// Cache-first strategy for static assets
function cacheFirst(request) {
    return caches.match(request)
        .then((cached) => {
            if (cached) {
                console.log('[SW] Serving from cache:', request.url);
                return cached;
            }
            
            // Fetch from network and cache
            return fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    
                    if (response.status === 200) {
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                    }
                    
                    return response;
                })
                .catch((error) => {
                    console.error('[SW] Network fetch failed:', error);
                    
                    // Return offline fallback
                    if (request.destination === 'document') {
                        return caches.match('/offline/');
                    }
                    
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
        });
}

// Stale-while-revalidate strategy for general content
function staleWhileRevalidate(request) {
    return caches.open(DYNAMIC_CACHE)
        .then((cache) => {
            return cache.match(request)
                .then((cached) => {
                    // Fetch from network in background
                    const fetchPromise = fetch(request)
                        .then((response) => {
                            if (response.status === 200) {
                                cache.put(request, response.clone());
                            }
                            return response;
                        })
                        .catch((error) => {
                            console.error('[SW] Background fetch failed:', error);
                        });
                    
                    // Return cached version immediately, or wait for network
                    return cached || fetchPromise;
                });
        });
}

// ===== BACKGROUND SYNC =====

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === BACKGROUND_SYNC_TAG) {
        event.waitUntil(syncData());
    }
});

// Sync critical business data in background
function syncData() {
    return Promise.all([
        syncOrders(),
        syncInventory(),
        syncNotifications()
    ])
    .then(() => {
        console.log('[SW] Background sync completed successfully');
        
        // Notify clients about successful sync
        return self.clients.matchAll()
            .then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_COMPLETE',
                        timestamp: new Date().toISOString()
                    });
                });
            });
    })
    .catch((error) => {
        console.error('[SW] Background sync failed:', error);
        
        // Retry sync later
        return Promise.reject(error);
    });
}

// Sync orders data
function syncOrders() {
    return fetch('/api/orders/sync/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'sync_pending',
            timestamp: new Date().toISOString()
        })
    })
    .then((response) => {
        if (response.ok) {
            console.log('[SW] Orders synced successfully');
            return response.json();
        }
        throw new Error('Orders sync failed');
    });
}

// Sync inventory data
function syncInventory() {
    return fetch('/api/inventory/sync/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'sync_levels',
            timestamp: new Date().toISOString()
        })
    })
    .then((response) => {
        if (response.ok) {
            console.log('[SW] Inventory synced successfully');
            return response.json();
        }
        throw new Error('Inventory sync failed');
    });
}

// Sync notifications
function syncNotifications() {
    return fetch('/api/notifications/sync/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then((response) => {
        if (response.ok) {
            console.log('[SW] Notifications synced successfully');
            return response.json();
        }
        throw new Error('Notifications sync failed');
    });
}

// ===== PUSH NOTIFICATIONS =====

self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    let notificationData = {
        title: 'Stock It Up',
        body: 'Nieuwe update beschikbaar', // Dutch: New update available
        icon: '/static/images/icon-192x192.png',
        badge: '/static/images/badge-72x72.png',
        tag: 'stock-it-up-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'Bekijken', // Dutch: View
                icon: '/static/images/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Sluiten', // Dutch: Close
                icon: '/static/images/action-close.png'
            }
        ]
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = { ...notificationData, ...payload };
        } catch (error) {
            console.error('[SW] Failed to parse push data:', error);
            notificationData.body = event.data.text() || notificationData.body;
        }
    }
    
    // Localize notification based on user preference
    if (notificationData.language === 'ar') {
        notificationData = localizeNotificationArabic(notificationData);
    } else {
        notificationData = localizeNotificationDutch(notificationData);
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Localize notification for Dutch users
function localizeNotificationDutch(data) {
    const dutchMessages = {
        'order_received': 'Nieuwe bestelling ontvangen',
        'inventory_low': 'Voorraad bijna op',
        'sync_complete': 'Synchronisatie voltooid',
        'error_occurred': 'Er is een fout opgetreden'
    };
    
    if (data.type && dutchMessages[data.type]) {
        data.body = dutchMessages[data.type];
    }
    
    // Dutch action labels
    if (data.actions) {
        data.actions = data.actions.map(action => {
            switch (action.action) {
                case 'view':
                    return { ...action, title: 'Bekijken' };
                case 'dismiss':
                    return { ...action, title: 'Sluiten' };
                case 'details':
                    return { ...action, title: 'Details' };
                default:
                    return action;
            }
        });
    }
    
    return data;
}

// Localize notification for Arabic users
function localizeNotificationArabic(data) {
    const arabicMessages = {
        'order_received': 'تم استلام طلب جديد',
        'inventory_low': 'المخزون منخفض',
        'sync_complete': 'تمت المزامنة بنجاح',
        'error_occurred': 'حدث خطأ'
    };
    
    if (data.type && arabicMessages[data.type]) {
        data.body = arabicMessages[data.type];
    }
    
    // Arabic action labels
    if (data.actions) {
        data.actions = data.actions.map(action => {
            switch (action.action) {
                case 'view':
                    return { ...action, title: 'عرض' };
                case 'dismiss':
                    return { ...action, title: 'إغلاق' };
                case 'details':
                    return { ...action, title: 'التفاصيل' };
                default:
                    return action;
            }
        });
    }
    
    // Set text direction for Arabic
    data.dir = 'rtl';
    
    return data;
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        // Open or focus the app
        event.waitUntil(
            self.clients.matchAll({ type: 'window' })
                .then((clients) => {
                    // Focus existing window if available
                    for (let client of clients) {
                        if (client.url.includes(self.location.origin)) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window
                    return self.clients.openWindow('/');
                })
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification (already done above)
        console.log('[SW] Notification dismissed');
    }
});

// ===== MESSAGE HANDLING =====

self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'CACHE_CLEAR':
                clearAllCaches()
                    .then(() => {
                        event.ports[0].postMessage({ success: true });
                    })
                    .catch((error) => {
                        event.ports[0].postMessage({ 
                            success: false, 
                            error: error.message 
                        });
                    });
                break;
                
            case 'SYNC_REQUEST':
                event.waitUntil(syncData());
                break;
                
            default:
                console.log('[SW] Unknown message type:', event.data.type);
        }
    }
});

// ===== UTILITY FUNCTIONS =====

// Check if endpoint requires network-first strategy
function isNetworkFirstEndpoint(pathname) {
    return NETWORK_FIRST_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// Check if endpoint is business-critical
function isCriticalEndpoint(pathname) {
    return CRITICAL_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// Check if request is for a static asset
function isStaticAsset(url) {
    return url.pathname.startsWith('/static/') || 
           url.hostname !== self.location.hostname ||
           url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/);
}

// Clear all caches
function clearAllCaches() {
    return caches.keys()
        .then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[SW] Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
        .then(() => {
            console.log('[SW] All caches cleared');
        });
}

// Get cache size for debugging
function getCacheSize(cacheName) {
    return caches.open(cacheName)
        .then((cache) => {
            return cache.keys();
        })
        .then((keys) => {
            console.log(`[SW] Cache ${cacheName} contains ${keys.length} items`);
            return keys.length;
        });
}

// Log cache status for debugging
function logCacheStatus() {
    Promise.all([
        getCacheSize(CACHE_NAME),
        getCacheSize(DYNAMIC_CACHE)
    ]).then(([staticSize, dynamicSize]) => {
        console.log(`[SW] Cache status - Static: ${staticSize}, Dynamic: ${dynamicSize}`);
    });
}

// Periodic cache cleanup (every 6 hours)
setInterval(() => {
    console.log('[SW] Performing periodic cache cleanup');
    
    caches.open(DYNAMIC_CACHE)
        .then((cache) => {
            return cache.keys();
        })
        .then((keys) => {
            // Keep only the 50 most recent dynamic cache entries
            if (keys.length > 50) {
                const keysToDelete = keys.slice(0, keys.length - 50);
                return Promise.all(
                    keysToDelete.map((key) => {
                        return caches.delete(key.url);
                    })
                );
            }
        })
        .then(() => {
            console.log('[SW] Periodic cache cleanup completed');
        })
        .catch((error) => {
            console.error('[SW] Periodic cache cleanup failed:', error);
        });
}, 6 * 60 * 60 * 1000); // 6 hours

/**
 * Service Worker Capabilities Summary:
 * ملخص قدرات عامل الخدمة:
 * 
 * 1. PWA Features:
 *    - Offline-first functionality for business continuity
 *    - Background synchronization for critical data
 *    - Push notifications with Dutch/Arabic localization
 *    - App-like installation and usage experience
 * 
 * 2. Caching Strategies:
 *    - Network-first for real-time marketplace data
 *    - Cache-first for static assets and UI components
 *    - Stale-while-revalidate for general content
 *    - Selective caching for business-critical endpoints
 * 
 * 3. Business Integration:
 *    - Order synchronization in background
 *    - Inventory level monitoring and sync
 *    - Notification system for business events
 *    - Multi-marketplace status updates
 * 
 * 4. Performance Optimization:
 *    - Intelligent cache management
 *    - Periodic cache cleanup
 *    - Resource prioritization
 *    - Network fallback strategies
 * 
 * 5. Multi-language Support:
 *    - Dutch interface notifications
 *    - Arabic language support
 *    - Localized action buttons
 *    - Cultural notification preferences
 */