from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'routes', views.RouteViewSet)
router.register(r'schedules', views.RouteScheduleViewSet)
router.register(r'executions', views.RouteExecutionViewSet)
router.register(r'optimizations', views.RouteOptimizationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]