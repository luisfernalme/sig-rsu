from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'collection-points', views.CollectionPointViewSet)
router.register(r'collection-records', views.CollectionRecordViewSet)
router.register(r'waste-types', views.WasteTypeViewSet)
router.register(r'point-waste-types', views.CollectionPointWasteTypeViewSet)
router.register(r'photos', views.CollectionPointPhotoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]