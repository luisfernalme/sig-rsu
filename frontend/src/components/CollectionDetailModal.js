import React from "react";
import { Modal, Button, Row, Col, Badge, ListGroup } from "react-bootstrap";

const CollectionDetailModal = ({ show, onHide, collection }) => {
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
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-clipboard-list me-2"></i>
          Detalhes da Coleta #{collection.id}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
            <p className="fw-bold">{collection.driver_name || "N/A"}</p>
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
                    : "N/A"}
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
                      : "N/A"}
                  </p>
                </Col>
              )}
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="text-muted">Total Coletado</h6>
                <p className="fw-bold">{collection.total_weight || 0} kg</p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted">Pontos Coletados</h6>
                <p className="fw-bold">
                  {collection.points_completed || 0} /{" "}
                  {collection.total_points || 0}
                </p>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <h6 className="text-muted">Distância Percorrida</h6>
                <p className="fw-bold">
                  {collection.distance_traveled || 0} km
                </p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted">Combustível Usado</h6>
                <p className="fw-bold">{collection.fuel_consumed || 0} L</p>
              </Col>
            </Row>
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

        {collection.points && collection.points.length > 0 && (
          <Row className="mb-3">
            <Col xs={12}>
              <h6 className="text-muted">Pontos da Rota</h6>
              <ListGroup>
                {collection.points.map((point, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{point.name}</strong>
                      <br />
                      <small className="text-muted">{point.address}</small>
                    </div>
                    {point.collected && (
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
