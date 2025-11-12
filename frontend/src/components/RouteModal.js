import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
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

const RouteModal = ({ show, onHide, onSave, route, collectionPoints = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily",
    status: "active",
    estimated_duration: "01:00:00",
    estimated_distance: 0,
    collection_points: [],
  });

  const [routePoints, setRoutePoints] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([-15.7942, -47.8825]); // Brasília
  const [useRealRouting, setUseRealRouting] = useState(true); // Usar roteamento real por padrão

  useEffect(() => {
    if (!show) return; // Só executar quando modal está visível

    console.log("RouteModal mounted/updated");
    console.log("Pontos de coleta recebidos:", collectionPoints.length);
    console.log("Rota recebida:", route);

    if (route) {
      setFormData({
        name: route.name || "",
        description: route.description || "",
        frequency: route.frequency || "daily",
        status: route.status || "active",
        estimated_duration: route.estimated_duration || "01:00:00",
        estimated_distance: route.estimated_distance || 0,
        collection_points: route.collection_points || [],
      });

      // Se a rota tem geometria, extrair os pontos
      if (route.geometry && route.geometry.coordinates) {
        const points = route.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);
        setRoutePoints(points);
        if (points.length > 0) {
          setMapCenter(points[0]);
        }
      }

      // Pontos de coleta selecionados
      if (route.collection_points) {
        const selectedIds = route.collection_points.map((cp) => cp.id || cp);
        setSelectedPoints(selectedIds);
        console.log("Pontos selecionados da rota:", selectedIds);
      }
    } else {
      // Reset para nova rota
      setFormData({
        name: "",
        description: "",
        frequency: "daily",
        status: "active",
        estimated_duration: "01:00:00",
        estimated_distance: 0,
        collection_points: [],
      });
      setRoutePoints([]);
      setSelectedPoints([]);
    }
  }, [route, show]); // Removido collectionPoints para evitar re-renders

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePointSelection = (e) => {
    const pointId = parseInt(e.target.value);
    if (e.target.checked) {
      const newPoints = [...selectedPoints, pointId];
      setSelectedPoints(newPoints);

      // Automaticamente criar/atualizar rota com os pontos selecionados
      updateRouteFromPoints(newPoints);
    } else {
      const newPoints = selectedPoints.filter((id) => id !== pointId);
      setSelectedPoints(newPoints);

      // Atualizar rota removendo o ponto
      updateRouteFromPoints(newPoints);
    }
  };

  // Função para atualizar rota baseado nos pontos selecionados
  const updateRouteFromPoints = (pointIds) => {
    console.log("updateRouteFromPoints chamada com:", pointIds);
    console.log("collectionPoints disponíveis:", collectionPoints);

    if (pointIds.length === 0) {
      setRoutePoints([]);
      setFormData((prev) => ({ ...prev, estimated_distance: 0 }));
      return;
    }

    // Pegar coordenadas dos pontos selecionados na ordem
    const points = pointIds
      .map((id) => {
        const point = collectionPoints.find((p) => p.id === id);
        console.log(`Procurando ponto ${id}:`, point);
        return point;
      })
      .filter((p) => {
        const hasLocation = p && p.location;
        console.log("Ponto tem location?", hasLocation, p);

        if (!hasLocation) return false;

        // Verificar diferentes formatos de coordenadas
        if (p.location.coordinates) {
          console.log("Coordenadas encontradas:", p.location.coordinates);
          return true;
        }
        if (p.location.type === "Point" && p.location.coordinates) {
          console.log(
            "Coordenadas GeoJSON encontradas:",
            p.location.coordinates
          );
          return true;
        }
        if (p.latitude && p.longitude) {
          console.log("Lat/Lng encontrados:", p.latitude, p.longitude);
          return true;
        }

        console.log("Formato de location não reconhecido:", p.location);
        return false;
      })
      .map((p) => {
        // Suportar diferentes formatos de coordenadas
        if (p.location.coordinates) {
          const coords = p.location.coordinates;
          // GeoJSON usa [lng, lat]
          const [lng, lat] = coords;
          console.log(
            `Convertendo ${p.name}: [${lng}, ${lat}] -> [${lat}, ${lng}]`
          );
          return [lat, lng];
        }
        if (p.latitude && p.longitude) {
          console.log(
            `Usando lat/lng direto de ${p.name}: [${p.latitude}, ${p.longitude}]`
          );
          return [p.latitude, p.longitude];
        }
        return null;
      })
      .filter((p) => p !== null);

    console.log("Pontos processados para rota:", points);

    if (points.length >= 1) {
      // Centralizar mapa no primeiro ponto
      if (points.length > 0) {
        setMapCenter(points[0]);
      }

      // Se houver pelo menos 2 pontos, buscar rota
      if (points.length >= 2) {
        setLoading(true);

        if (useRealRouting) {
          // Buscar rota real seguindo as ruas
          fetchRealRoute(points)
            .then((result) => {
              console.log("Rota real obtida:", result);
              setRoutePoints(result.points);
              setFormData((prev) => ({
                ...prev,
                estimated_distance: result.distance,
                estimated_duration: result.duration || prev.estimated_duration,
              }));
            })
            .catch((error) => {
              console.error("Erro ao obter rota:", error);
              // Fallback: usar linha reta
              setRoutePoints(points);
              const distance = calculateTotalDistanceHaversine(points);
              setFormData((prev) => ({
                ...prev,
                estimated_distance: distance,
              }));
            })
            .finally(() => {
              setLoading(false);
            });
        } else {
          // Usar linha reta entre pontos
          setRoutePoints(points);
          const distance = calculateTotalDistanceHaversine(points);
          setFormData((prev) => ({
            ...prev,
            estimated_distance: distance,
          }));
          setLoading(false);
        }
      } else {
        // Apenas 1 ponto
        setRoutePoints(points);
      }
    } else {
      console.warn("Nenhum ponto válido encontrado!");
      setRoutePoints([]);
    }
  };

  // Não simplificar pontos da rota - manter todos os pontos para máxima precisão
  const simplifyRoute = (points, maxPoints = null) => {
    // Retornar todos os pontos sem simplificação
    console.log(
      `Mantendo todos os ${points.length} pontos da rota (sem simplificação)`
    );
    return points;
  };

  // Converter segundos para formato HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Buscar rota real usando OSRM (Open Source Routing Machine)
  const fetchRealRoute = async (points) => {
    if (points.length < 2) return { points, distance: 0 };

    try {
      // Converter pontos para formato OSRM: lng,lat;lng,lat;...
      const coordinates = points.map((p) => `${p[1]},${p[0]}`).join(";");

      // API pública do OSRM - usando 'full' para máximo detalhe, depois simplificamos
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

      console.log("Buscando rota real via OSRM:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Extrair coordenadas da geometria (vem em GeoJSON)
        let routeCoordinates = route.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);

        // Simplificar ainda mais se necessário
        routeCoordinates = simplifyRoute(routeCoordinates);

        // Distância em metros, converter para km
        const distance = (route.distance / 1000).toFixed(2);

        // Duração em segundos, converter para HH:MM:SS
        const duration = formatDuration(route.duration);

        console.log(
          `Rota real calculada: ${distance} km, ${duration}, ${routeCoordinates.length} pontos`
        );

        return {
          points: routeCoordinates,
          distance: parseFloat(distance),
          duration: duration,
        };
      } else {
        console.warn("OSRM não retornou rota válida, usando linha reta");
        return fallbackStraightRoute(points);
      }
    } catch (error) {
      console.error("Erro ao buscar rota real:", error);
      console.log("Fallback para linha reta entre pontos");
      return fallbackStraightRoute(points);
    }
  };

  // Fallback: linha reta com cálculo Haversine
  const fallbackStraightRoute = (points) => {
    const distance = calculateTotalDistanceHaversine(points);
    return { points, distance };
  };

  // Calcular distância total entre pontos (Haversine - linha reta)
  const calculateTotalDistanceHaversine = (points) => {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += calculateDistance(points[i], points[i + 1]);
    }
    return parseFloat(totalDistance.toFixed(2));
  };

  // Fórmula de Haversine para calcular distância entre dois pontos
  const calculateDistance = (point1, point2) => {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;

    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome da rota é obrigatório";
    }

    if (!formData.frequency) {
      newErrors.frequency = "Frequência é obrigatória";
    }

    if (formData.estimated_distance && formData.estimated_distance <= 0) {
      newErrors.estimated_distance = "Distância deve ser maior que zero";
    }

    if (selectedPoints.length < 2) {
      newErrors.collection_points =
        "Selecione pelo menos 2 pontos de coleta para criar uma rota";
    }

    if (routePoints.length < 2) {
      newErrors.geometry =
        "A rota precisa ter pelo menos 2 pontos. Selecione mais pontos de coleta.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Converter pontos da rota para GeoJSON LineString
      const coordinates = routePoints.map((point) => [point[1], point[0]]); // [lng, lat]

      // GeoJSON puro (DRF com GIS suporta automaticamente)
      const geometry = {
        type: "LineString",
        coordinates: coordinates,
      };

      // Preparar pontos de coleta com ordem de sequência
      const collection_points = selectedPoints.map((pointId, index) => ({
        point_id: pointId,
        sequence_order: index + 1,
        estimated_collection_time: "00:15:00", // 15 minutos padrão
      }));

      const routeData = {
        name: formData.name,
        description: formData.description,
        frequency: formData.frequency,
        status: formData.status,
        estimated_duration: formData.estimated_duration,
        estimated_distance: parseFloat(formData.estimated_distance) || 0,
        geometry: JSON.stringify(geometry), // ✅ Converter para STRING
        collection_points: collection_points,
      };

      console.log("Enviando dados da rota:", routeData);
      console.log("Geometria:", JSON.stringify(geometry, null, 2));

      await onSave(routeData);
      onHide();
    } catch (error) {
      console.error("Erro ao salvar rota:", error);
      console.error("Resposta do servidor:", error.response?.data);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        error.message ||
        "Erro ao salvar rota";

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Componente para capturar cliques no mapa (para ajustes manuais)
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (manualEditMode) {
          const { lat, lng } = e.latlng;
          setRoutePoints((prev) => [...prev, [lat, lng]]);
        }
      },
    });
    return null;
  };

  const [manualEditMode, setManualEditMode] = useState(false);

  const toggleManualEdit = () => {
    setManualEditMode(!manualEditMode);
  };

  const clearRoute = () => {
    setRoutePoints([]);
    setSelectedPoints([]);
    setFormData((prev) => ({ ...prev, estimated_distance: 0 }));
  };

  const undoLastPoint = () => {
    if (manualEditMode) {
      setRoutePoints((prev) => prev.slice(0, -1));
    } else {
      // Remove último ponto selecionado
      const newPoints = selectedPoints.slice(0, -1);
      setSelectedPoints(newPoints);
      updateRouteFromPoints(newPoints);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-route me-2"></i>
          {route ? "Editar Rota" : "Nova Rota"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.submit && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setErrors({ ...errors, submit: null })}
            >
              {errors.submit}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <h6 className="mb-3">Informações da Rota</h6>

              <Form.Group className="mb-3">
                <Form.Label>Nome da Rota *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  placeholder="Ex: Rota Centro"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descrição</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrição da rota"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Frequência *</Form.Label>
                    <Form.Select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      isInvalid={!!errors.frequency}
                    >
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quinzenal</option>
                      <option value="monthly">Mensal</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.frequency}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                      <option value="maintenance">Em Manutenção</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Duração Estimada (HH:MM:SS)</Form.Label>
                    <Form.Control
                      type="text"
                      name="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={handleChange}
                      placeholder="01:30:00"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Distância (km)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="estimated_distance"
                      value={formData.estimated_distance}
                      onChange={handleChange}
                      isInvalid={!!errors.estimated_distance}
                      placeholder="0.0"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.estimated_distance}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Pontos de Coleta *</Form.Label>
                {errors.collection_points && (
                  <div className="text-danger small mb-2">
                    {errors.collection_points}
                  </div>
                )}
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    padding: "8px",
                  }}
                >
                  {collectionPoints.length > 0 ? (
                    collectionPoints.map((point) => (
                      <Form.Check
                        key={point.id}
                        type="checkbox"
                        id={`point-${point.id}`}
                        label={`${point.name} (${point.code})`}
                        value={point.id}
                        checked={selectedPoints.includes(point.id)}
                        onChange={handlePointSelection}
                      />
                    ))
                  ) : (
                    <p className="text-muted mb-0">
                      Nenhum ponto de coleta disponível
                    </p>
                  )}
                </div>
              </Form.Group>
            </Col>

            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Visualização da Rota</h6>
                <div>
                  <Button
                    variant={useRealRouting ? "success" : "outline-secondary"}
                    size="sm"
                    onClick={() => {
                      setUseRealRouting(!useRealRouting);
                      // Recalcular rota com novo modo
                      if (selectedPoints.length >= 2) {
                        updateRouteFromPoints(selectedPoints);
                      }
                    }}
                    className="me-2"
                    title={
                      useRealRouting
                        ? "Rota segue as ruas"
                        : "Linha reta entre pontos"
                    }
                  >
                    <i
                      className={
                        useRealRouting ? "fas fa-route" : "fas fa-draw-polygon"
                      }
                    ></i>
                    {useRealRouting ? "GPS" : "Linha"}
                  </Button>
                  <Button
                    variant={manualEditMode ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={toggleManualEdit}
                    className="me-2"
                    title="Ativar modo de edição manual"
                  >
                    <i className="fas fa-edit"></i>{" "}
                    {manualEditMode ? "Manual" : "Auto"}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={undoLastPoint}
                    disabled={routePoints.length === 0}
                    className="me-2"
                  >
                    <i className="fas fa-undo"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={clearRoute}
                    disabled={routePoints.length === 0}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>

              {errors.geometry && (
                <div className="text-danger small mb-2">{errors.geometry}</div>
              )}

              {loading && (
                <div className="text-center mb-2">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <small className="text-muted">
                    {useRealRouting
                      ? "Calculando rota seguindo as ruas..."
                      : "Calculando rota..."}
                  </small>
                </div>
              )}

              <div
                style={{
                  height: "450px",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {loading && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      zIndex: 1000,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Spinner animation="border" variant="primary" />
                    <small className="text-muted mt-2">Buscando rota...</small>
                  </div>
                )}
                {show && (
                  <MapContainer
                    key={`map-${show ? "open" : "closed"}`}
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler />

                    {/* Pontos de coleta no mapa - Não renderizar para evitar erro */}
                    {false &&
                      Array.isArray(collectionPoints) &&
                      collectionPoints.map((point) => {
                        let lat, lng;

                        // Suportar diferentes formatos de coordenadas
                        if (point.location && point.location.coordinates) {
                          [lng, lat] = point.location.coordinates;
                        } else if (point.latitude && point.longitude) {
                          lat = point.latitude;
                          lng = point.longitude;
                        } else {
                          return null;
                        }

                        const isSelected = selectedPoints.includes(point.id);

                        return (
                          <Marker
                            key={`collection-point-${point.id}`}
                            position={[lat, lng]}
                            opacity={isSelected ? 1.0 : 0.5}
                          />
                        );
                      })}

                    {/* Linha da rota */}
                    {routePoints.length > 1 && (
                      <Polyline
                        positions={routePoints}
                        color="blue"
                        weight={4}
                        opacity={0.7}
                      />
                    )}

                    {/* Marcadores dos pontos da rota */}
                    {routePoints.map((point, idx) => (
                      <Marker key={`route-point-${idx}`} position={point} />
                    ))}
                  </MapContainer>
                )}
              </div>

              <small className="text-muted d-block mt-2">
                <i className="fas fa-info-circle me-1"></i>
                {manualEditMode ? (
                  <>
                    Modo Manual: Clique no mapa para adicionar pontos
                    customizados à rota.
                  </>
                ) : (
                  <>
                    Modo Automático: A rota é criada automaticamente conectando
                    os pontos de coleta selecionados. Use "Manual" para fazer
                    ajustes finos.
                  </>
                )}
              </small>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                {route ? "Atualizar" : "Criar"} Rota
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RouteModal;
