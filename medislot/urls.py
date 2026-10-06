from django.contrib import admin
from django.urls import include, path

urlpatterns = [path("admin/", admin.site.urls), path("", include("core.urls"))]

handler403 = "core.views.forbidden"
handler404 = "core.views.not_found"
