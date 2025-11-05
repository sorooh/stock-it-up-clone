"""
Stock It Up Clone URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.contrib.auth.decorators import login_required

# Import views for main pages
from apps.core.views import DashboardView, HomeView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Core URLs
    path('', HomeView.as_view(), name='home'),
    path('dashboard/', login_required(DashboardView.as_view()), name='dashboard'),
    
    # Onboarding URLs - 4-step process matching original
    path('welkom/', include('apps.onboarding.urls')),
    
    # Product Management URLs
    path('products/', include('apps.products.urls')),
    path('inventory/', include('apps.products.urls')),  # Inventory management
    path('zoeken/', include('apps.products.urls')),     # Global search with duplicate detection
    
    # Order Management URLs
    path('orders/', include('apps.orders.urls')),
    path('orders2/', include('apps.orders.urls')),      # New order system endpoints
    
    # Channel Management URLs (Marketplace connections)
    path('channels/', include('apps.channels.urls')),
    path('api/v1/sellers/', include('apps.channels.urls')),  # OAuth endpoints
    
    # Analytics and Performance URLs
    path('prestaties/', include('apps.analytics.urls')),
    
    # Fulfiller Management URLs
    path('fulfillers/', include('apps.fulfillers.urls')),
    
    # Warehouse Management URLs
    path('warehouses/', include('apps.warehouses.urls')),
    
    # API endpoints
    path('api/', include([
        path('v1/', include([
            path('products/', include('apps.products.api_urls')),
            path('orders/', include('apps.orders.api_urls')),
            path('channels/', include('apps.channels.api_urls')),
            path('analytics/', include('apps.analytics.api_urls')),
            path('sellers/', include('apps.channels.api_urls')),  # OAuth and channel management
        ])),
    ])),
    
    # Authentication URLs
    path('accounts/', include('django.contrib.auth.urls')),
    
    # WebSocket and real-time updates (Stimulus Reflex)
    path('cable/', include('stimulus_reflex.urls')),
    
    # PWA manifest and service worker
    path('manifest.json', include('apps.core.urls')),
    path('sw.js', include('apps.core.urls')),
    
    # Favicon redirect
    path('favicon.ico', RedirectView.as_view(url='/static/img/favicon.ico', permanent=True)),
]

# Development URLs for media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Django Debug Toolbar (if installed)
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass

# Custom error handlers
handler404 = 'apps.core.views.handler404'
handler500 = 'apps.core.views.handler500'

# Admin site customization
admin.site.site_header = 'Stock It Up Clone Administration'
admin.site.site_title = 'Stock It Up Clone Admin'
admin.site.index_title = 'Welcome to Stock It Up Clone Administration'