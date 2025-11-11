import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Badge,
  ListGroup,
  Tabs,
  Tab,
  Spinner,
} from "react-bootstrap";
import RouteMapView from "./RouteMapView";
import { routesAPI } from "../services/api";

const CollectionDetailModal = ({ show, onHide, collection }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [routeData, setRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Reset tab when modal opens
  useEffect(() => {
    if (show) {
      setActiveTab("info");
      setRouteData(null);
    }
  }, [show]);

  // Buscar dados da rota quando abrir a aba do mapa
  useEffect(() => {
    if (show && activeTab === "map" && collection?.route && !routeData) {
      console.log("Buscando rota ID:", collection.route);
      setLoadingRoute(true);
      routesAPI
        .getRoute(collection.route)
        .then((data) => {
          console.log("Dados da rota recebidos:", data);
          console.log("Geometria da rota:", data.geometry);
          setRouteData(data);
          setLoadingRoute(false);
        })
        .catch((err) => {
          console.error("Erro ao buscar rota:", err);
          setLoadingRoute(false);
        });
    }
  }, [show, activeTab, collection, routeData]);

  if (!collection) return null;

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      in_progress: "info",
      completed: "success",
      cancelled: "danger",
    };

    const labels = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };

    return <Badge bg={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-clipboard-list me-2"></i>
          Detalhes da Coleta #{collection.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          {/* Aba de Informações */}
          <Tab
            eventKey="info"
            title={
              <>
                <i className="fas fa-info-circle me-2"></i>Informações
              </>
            }
          >
            <Row className="mb-3">
              <Col xs={12}>
                <h5>Status</h5>
                {getStatusBadge(collection.status)}
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="text-muted">Rota</h6>
                <p className="fw-bold">{collection.route_name || "N/A"}</p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted">Veículo</h6>
                <p className="fw-bold">{collection.vehicle_plate || "N/A"}</p>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="text-muted">Motorista</h6>
                <p className="fw-bold">
                  {collection.driver_name_display ||
                    collection.driver_name ||
                    "N/A"}
                </p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted">Data Agendada</h6>
                <p className="fw-bold">
                  {collection.scheduled_date
                    ? new Date(collection.scheduled_date).toLocaleDateString(
                        "pt-BR"
                      )
                    : "N/A"}
                </p>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="text-muted">Horário Agendado</h6>
                <p className="fw-bold">{collection.scheduled_time || "N/A"}</p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted">Duração</h6>
                <p className="fw-bold">{collection.duration || "N/A"}</p>
              </Col>
            </Row>

            {(collection.status === "completed" ||
              collection.status === "in_progress") && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted">Hora de Início</h6>
                    <p className="fw-bold">
                      {collection.start_time
                        ? new Date(collection.start_time).toLocaleTimeString(
                            "pt-BR"
                          )
                        : collection.actual_start_time || "N/A"}
                    </p>
                  </Col>
                  {collection.status === "completed" && (
                    <Col md={6}>
                      <h6 className="text-muted">Hora de Término</h6>
                      <p className="fw-bold">
                        {collection.end_time
                          ? new Date(collection.end_time).toLocaleTimeString(
                              "pt-BR"
                            )
                          : collection.actual_end_time || "N/A"}
                      </p>
                    </Col>
                  )}
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted">Peso Coletado</h6>
                    <p className="fw-bold">
                      {collection.waste_collected_weight ||
                        collection.total_weight ||
                        0}{" "}
                      kg
                    </p>
                  </Col>
                  {collection.waste_collected_volume && (
                    <Col md={6}>
                      <h6 className="text-muted">Volume Coletado</h6>
                      <p className="fw-bold">
                        {collection.waste_collected_volume} m³
                      </p>
                    </Col>
                  )}
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted">Pontos Coletados</h6>
                    <p className="fw-bold">
                      {collection.points_completed || 0} /{" "}
                      {collection.total_points || 0}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted">Distância Percorrida</h6>
                    <p className="fw-bold">
                      {collection.distance_traveled || 0} km
                    </p>
                  </Col>
                </Row>

                {collection.fuel_consumed > 0 && (
                  <Row className="mb-3">
                    <Col md={6}>
                      <h6 className="text-muted">Combustível Usado</h6>
                      <p className="fw-bold">
                        {collection.fuel_consumed || 0} L
                      </p>
                    </Col>
                  </Row>
                )}
              </>
            )}

            {collection.notes && (
              <Row className="mb-3">
                <Col xs={12}>
                  <h6 className="text-muted">Observações</h6>
                  <p>{collection.notes}</p>
                </Col>
              </Row>
            )}

            {collection.collection_items &&
              collection.collection_items.length > 0 && (
                <Row className="mb-3">
                  <Col xs={12}>
                    <h6 className="text-muted">Pontos da Rota</h6>
                    <ListGroup>
                      {/* Remover duplicatas baseado no ID ou collection_point */}
                      {collection.collection_items
                        .filter(
                          (item, index, self) =>
                            index ===
                            self.findIndex(
                              (t) =>
                                t.id === item.id ||
                                t.collection_point === item.collection_point
                            )
                        )
                        .map((item) => (
                          <ListGroup.Item
                            key={`item-${
                              item.id || item.collection_point
                            }-${Math.random()}`}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong>{item.collection_point_name}</strong>
                              <br />
                              <small className="text-muted">
                                {item.collection_point_address}
                              </small>
                              {item.weight > 0 && (
                                <>
                                  <br />
                                  <small className="text-primary">
                                    <i className="fas fa-weight me-1"></i>
                                    {item.weight} kg
                                  </small>
                                </>
                              )}
                            </div>
                            {item.collected && (
                              <Badge bg="success">
                                <i className="fas fa-check me-1"></i>
                                Coletado
                              </Badge>
                            )}
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  </Col>
                </Row>
              )}
          </Tab>

          {/* Aba do Mapa */}
          <Tab
            eventKey="map"
            title={
              <>
                <i className="fas fa-map me-2"></i>Mapa da Rota
              </>
            }
          >
            <div style={{ height: "500px" }}>
              {loadingRoute && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Carregando mapa...</p>
                </div>
              )}
              {!loadingRoute && routeData && (
                <RouteMapView route={routeData} showFullscreen={false} />
              )}
              {!loadingRoute && !routeData && (
                <div className="alert alert-warning text-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Não foi possível carregar o mapa da rota.
                </div>
              )}
              {!collection.route && (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-map-marked-alt fa-3x mb-3"></i>
                  <p>Rota não disponível</p>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CollectionDetailModal;
