from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'public', views.PublicAPIViewSet, basename='public-api')

urlpatterns = [
    path('', include(router.urls)),
    path('collection-points-map/', views.collection_points_map, name='collection-points-map'),
    path('routes-map/', views.routes_map, name='routes-map'),
]