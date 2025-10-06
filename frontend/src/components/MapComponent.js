import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corrigir ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapComponent = ({ 
  center = [-23.5505, -46.6333], // São Paulo
  zoom = 12,
  points = [],
  routes = [],
  vehicles = [],
  onPointClick = null,
  onMapClick = null,
  isSelectionMode = false,
  selectedLocation = null,
  style = { height: '500px', width: '100%' }
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectionMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Inicializar mapa
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      // Adicionar camada base
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Adicionar listener de clique no mapa para seleção de localização
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          onMapClick({ latitude: lat, longitude: lng });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Atualizar pontos de coleta
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Limpar marcadores existentes (simples approach)
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Adicionar pontos de coleta
    points.forEach(point => {
      // Validar coordenadas antes de criar o marcador
      const lat = point.latitude;
      const lng = point.longitude;
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.warn('Coordenadas inválidas para o ponto:', point);
        return;
      }

      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`
          <div>
            <h6>${point.name || point.code}</h6>
            <p><strong>Endereço:</strong> ${point.address || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge ${getStatusBadgeClass(point.status)}">${getStatusLabel(point.status)}</span></p>
            <p><strong>Nível:</strong> ${point.current_fill_level || 0}%</p>
          </div>
        `);

      if (onPointClick) {
        marker.on('click', () => onPointClick(point));
      }
    });

    // Adicionar veículos
    vehicles.forEach(vehicle => {
      if (vehicle.lastLocation) {
        const lat = vehicle.lastLocation.latitude;
        const lng = vehicle.lastLocation.longitude;
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          console.warn('Coordenadas inválidas para o veículo:', vehicle);
          return;
        }

        const vehicleIcon = L.divIcon({
          html: `<i class="fas fa-truck" style="color: #007bff; font-size: 20px;"></i>`,
          iconSize: [25, 25],
          className: 'vehicle-marker'
        });

        L.marker([lat, lng], {
          icon: vehicleIcon
        })
          .addTo(map)
          .bindPopup(`
            <div>
              <h6><i class="fas fa-truck me-1"></i> ${vehicle.license_plate}</h6>
              <p><strong>Modelo:</strong> ${vehicle.brand} ${vehicle.model}</p>
              <p><strong>Status:</strong> <span class="badge ${getVehicleStatusClass(vehicle.status)}">${vehicle.status_display}</span></p>
            </div>
          `);
      }
    });

    // Adicionar rotas
    routes.forEach(route => {
      if (route.geometry && route.geometry.coordinates && Array.isArray(route.geometry.coordinates)) {
        try {
          const coordinates = route.geometry.coordinates
            .filter(coord => coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1]))
            .map(coord => [coord[1], coord[0]]); // Inverter lat/lng
          
          if (coordinates.length > 1) {
            L.polyline(coordinates, {
              color: '#28a745',
              weight: 4,
              opacity: 0.7
            })
              .addTo(map)
              .bindPopup(`
                <div>
                  <h6><i class="fas fa-route me-1"></i> ${route.name}</h6>
                  <p><strong>Descrição:</strong> ${route.description || 'N/A'}</p>
                  <p><strong>Distância:</strong> ${route.estimated_distance || 'N/A'} km</p>
                  <p><strong>Status:</strong> <span class="badge ${getRouteStatusClass(route.status)}">${route.status_display || route.status}</span></p>
                </div>
              `);
          }
        } catch (error) {
          console.warn('Erro ao processar geometria da rota:', route, error);
        }
      }
    });

  }, [points, routes, vehicles]);

  // Gerenciar marcador de seleção
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remover marcador anterior se existir
    if (selectionMarkerRef.current) {
      map.removeLayer(selectionMarkerRef.current);
      selectionMarkerRef.current = null;
    }

    // Adicionar novo marcador se há localização selecionada
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      const selectionIcon = L.divIcon({
        html: `<i class="fas fa-map-pin" style="color: #dc3545; font-size: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        className: 'selection-marker'
      });

      selectionMarkerRef.current = L.marker(
        [selectedLocation.latitude, selectedLocation.longitude], 
        { icon: selectionIcon }
      )
        .addTo(map)
        .bindPopup(`
          <div>
            <h6><i class="fas fa-map-pin me-1 text-danger"></i> Local Selecionado</h6>
            <p><strong>Coordenadas:</strong></p>
            <p>Lat: ${selectedLocation.latitude.toFixed(6)}</p>
            <p>Lng: ${selectedLocation.longitude.toFixed(6)}</p>
          </div>
        `);

      // Centralizar mapa na localização selecionada
      map.setView([selectedLocation.latitude, selectedLocation.longitude], map.getZoom());
    }
  }, [selectedLocation]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'full': return 'bg-danger';
      case 'maintenance': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'full': return 'Cheio';
      case 'maintenance': return 'Manutenção';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  const getVehicleStatusClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'maintenance': return 'bg-warning';
      case 'inactive': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getRouteStatusClass = (status) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'maintenance': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  return (
    <div 
      ref={mapRef} 
      style={style}
      className="leaflet-container border rounded"
    />
  );
};

export default MapComponent;