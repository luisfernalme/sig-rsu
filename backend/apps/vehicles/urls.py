from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'drivers', views.DriverViewSet)
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'maintenance', views.VehicleMaintenanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]