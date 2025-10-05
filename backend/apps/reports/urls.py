from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'reports', views.ReportsViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
    path('quick-stats/', views.quick_stats, name='quick-stats'),
]