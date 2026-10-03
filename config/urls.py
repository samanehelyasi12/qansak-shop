from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

admin.site.site_header = 'Qandak Bakery'
admin.site.index_title = 'Store administration'
admin.site.site_title = 'Qandak Bakery admin'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/', include('store.urls')),
]

# Uploaded product and category images. Development only: in production the web
# server or object store serves MEDIA_ROOT, never Django.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
