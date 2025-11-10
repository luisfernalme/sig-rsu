import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const RouteMapView = ({
  show,
  onHide,
  route,
  collectionPoints = [],
  showFullscreen = true,
}) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [mapCenter, setMapCenter] = useState([-15.7942, -47.8825]); // Brasília
  const [loading, setLoading] = useState(true);

  // Função para parsear WKT (Well-Known Text) para coordenadas
  const parseWKT = (wkt) => {
    try {
      // Remove SRID se existir: "SRID=4326;LINESTRING(...)"
      const cleanWkt = wkt.replace(/SRID=\d+;/, "");

      // Extrair coordenadas do LINESTRING
      // Formato: "LINESTRING(-46.567 -23.624, -46.633 -23.55)"
      const coordsMatch = cleanWkt.match(/LINESTRING\s*\((.*?)\)/i);
      if (!coordsMatch) {
        console.error("Formato WKT inválido:", wkt);
        return [];
      }

      const coordsString = coordsMatch[1];
      const points = coordsString.split(",").map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return [lat, lng]; // Leaflet usa [lat, lng]
      });

      return points;
    } catch (error) {
      console.error("Erro ao parsear WKT:", error);
      return [];
    }
  };

  useEffect(() => {
    if (route) {
      setLoading(true);

      console.log("RouteMapView - Dados da rota:", route);
      console.log("RouteMapView - Geometria recebida:", route.geometry);
      console.log("RouteMapView - Tipo da geometria:", typeof route.geometry);

      // Extrair pontos da geometria da rota
      if (route.geometry && route.geometry.coordinates) {
        // Geometria é objeto GeoJSON
        console.log("RouteMapView - Processando GeoJSON object");
        const points = route.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);
        console.log("RouteMapView - Pontos extraídos:", points);
        setRoutePoints(points);

        if (points.length > 0) {
          setMapCenter(points[0]);
        }
      } else if (route.geometry && typeof route.geometry === "string") {
        // Geometria é string (pode ser GeoJSON ou WKT)
        console.log("RouteMapView - Processando string");

        // Tentar GeoJSON primeiro
        if (route.geometry.startsWith("{")) {
          console.log("RouteMapView - Tentando parsear GeoJSON");
          try {
            const geom = JSON.parse(route.geometry);
            const points = geom.coordinates.map((coord) => [
              coord[1],
              coord[0],
            ]);
            console.log("RouteMapView - Pontos extraídos do GeoJSON:", points);
            setRoutePoints(points);

            if (points.length > 0) {
              setMapCenter(points[0]);
            }
          } catch (error) {
            console.error("Erro ao parsear GeoJSON:", error);
          }
        }
        // Se começa com SRID ou LINESTRING, é WKT
        else if (
          route.geometry.includes("LINESTRING") ||
          route.geometry.startsWith("SRID")
        ) {
          console.log("RouteMapView - Tentando parsear WKT");
          const points = parseWKT(route.geometry);
          console.log("RouteMapView - Pontos extraídos do WKT:", points);
          if (points.length > 0) {
            setRoutePoints(points);
            setMapCenter(points[0]);
          }
        }
      } else {
        console.warn("RouteMapView - Geometria não reconhecida ou vazia");
      }

      setLoading(false);
    }
  }, [route]);

  // Ícone customizado para pontos de coleta
  const collectionPointIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Diária",
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return labels[frequency] || frequency;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#28a745",
      inactive: "#6c757d",
      maintenance: "#ffc107",
    };
    return colors[status] || "#007bff";
  };

  if (!route) {
    return null;
  }

  // Conteúdo reutilizável do mapa
  const mapContent = loading ? (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Carregando mapa...</p>
    </div>
  ) : (
    <>
      {/* Informações da rota */}
      {showFullscreen && (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="row">
            <div className="col-md-3">
              <small className="text-muted">Frequência</small>
              <div className="fw-bold">
                {getFrequencyLabel(route.frequency)}
              </div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Status</small>
              <div
                className="fw-bold"
                style={{ color: getStatusColor(route.status) }}
              >
                {route.status_display || route.status}
              </div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Distância</small>
              <div className="fw-bold">{route.estimated_distance} km</div>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Duração</small>
              <div className="fw-bold">{route.estimated_duration}</div>
            </div>
          </div>
          {route.description && (
            <div className="mt-2">
              <small className="text-muted">Descrição</small>
              <div>{route.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div
        style={{
          height: "500px",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {routePoints.length > 0 ? (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Linha da rota */}
            <Polyline
              positions={routePoints}
              color={getStatusColor(route.status)}
              weight={5}
              opacity={0.7}
            />

            {/* Marcadores de início e fim */}
            {routePoints.length > 0 && (
              <>
                <Marker
                  position={routePoints[0]}
                  icon={L.divIcon({
                    className: "custom-div-icon",
                    html: '<div style="background-color: green; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">I</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  })}
                >
                  <Popup>
                    <strong>Início da Rota</strong>
                    <br />
                    {route.name}
                  </Popup>
                </Marker>

                <Marker
                  position={routePoints[routePoints.length - 1]}
                  icon={L.divIcon({
                    className: "custom-div-icon",
                    html: '<div style="background-color: red; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">F</div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  })}
                >
                  <Popup>
                    <strong>Fim da Rota</strong>
                    <br />
                    {route.name}
                  </Popup>
                </Marker>
              </>
            )}

            {/* Pontos de coleta */}
            {collectionPoints.map((point, idx) => {
              if (point.location && point.location.coordinates) {
                const [lng, lat] = point.location.coordinates;
                return (
                  <Marker
                    key={point.id}
                    position={[lat, lng]}
                    icon={collectionPointIcon}
                  >
                    <Popup>
                      <strong>{point.name}</strong>
                      <br />
                      <small className="text-muted">Código: {point.code}</small>
                      <br />
                      {point.address && (
                        <>
                          <small>{point.address}</small>
                          <br />
                        </>
                      )}
                      <small>Ordem: #{idx + 1}</small>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                      {point.name}
                    </Tooltip>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 bg-light">
            <div className="text-center text-muted">
              <i className="fas fa-map-marked-alt fa-3x mb-3"></i>
              <p>Esta rota não possui geometria definida</p>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-3 d-flex justify-content-center gap-4">
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "20px",
              height: "4px",
              backgroundColor: getStatusColor(route.status),
              marginRight: "8px",
            }}
          ></div>
          <small>Rota</small>
        </div>
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "green",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <small>Início</small>
        </div>
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: "red",
              borderRadius: "50%",
              marginRight: "8px",
            }}
          ></div>
          <small>Fim</small>
        </div>
        <div className="d-flex align-items-center">
          <img
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
            alt="Ponto de Coleta"
            style={{ width: "16px", height: "26px", marginRight: "8px" }}
          />
          <small>Pontos de Coleta</small>
        </div>
      </div>
    </>
  );

  // Modo embutido - retornar apenas o conteúdo
  if (!showFullscreen) {
    return mapContent;
  }

  // Modo modal - retornar com Modal wrapper
  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-map me-2"></i>
          Visualizar Rota: {route.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>{mapContent}</Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RouteMapView;
