import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import { vehiclesAPI } from "../services/api";
import VehicleModal from "../components/VehicleModal";
import VehicleTrackingModal from "../components/VehicleTrackingModal";

const STATUS_MAP = {
  active: { variant: "success", label: "Ativo" },
  inactive: { variant: "secondary", label: "Inativo" },
  maintenance: { variant: "warning", label: "Manutenção" },
};

const TYPE_MAP = {
  truck: "Caminhão",
  compactor: "Compactador",
  pickup: "Caminhonete",
  other: "Outro",
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingVehicle, setTrackingVehicle] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    vehicle_type: "",
  });
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
      if (filters.search) params.search = filters.search.trim();
      const data = await vehiclesAPI.getVehicles(params);
      // Suporta respostas paginadas do DRF ({ count, results, next, previous }) e listas simples
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setVehicles(items);
    } catch (err) {
      setError("Erro ao carregar veículos.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles, refreshFlag]);

  const openCreate = () => {
    setEditingVehicle(null);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingVehicle(v);
    setShowModal(true);
  };

  const openTracking = (v) => {
    setTrackingVehicle(v);
    setShowTracking(true);
  };

  const handleModalSave = async (payload) => {
    if (editingVehicle) {
      await vehiclesAPI.updateVehicle(editingVehicle.id, payload);
    } else {
      await vehiclesAPI.createVehicle(payload);
    }
    setRefreshFlag((f) => f + 1);
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Remover veículo ${vehicle.license_plate}?`)) return;
    try {
      await vehiclesAPI.deleteVehicle(vehicle.id);
      setRefreshFlag((f) => f + 1);
    } catch (err) {
      alert("Erro ao remover veículo.");
    }
  };

  const filteredVehicles = useMemo(() => vehicles, [vehicles]);

  const getStatusBadge = (status) => {
    const meta = STATUS_MAP[status] || { variant: "secondary", label: status };
    return (
      <Badge bg={meta.variant} className="status-badge">
        {meta.label}
      </Badge>
    );
  };

  const maintenanceDue = (v) => {
    if (!v.next_maintenance) return false;
    try {
      const today = new Date();
      const next = new Date(v.next_maintenance);
      return next <= today;
    } catch {
      return false;
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h2 className="mb-0">
                <i className="fas fa-truck me-2"></i>
                Gestão de Veículos
              </h2>
              <p className="text-muted mb-0">
                Gerencie a frota de veículos de coleta
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={openCreate}>
                <i className="fas fa-plus me-2"></i>
                Novo Veículo
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setRefreshFlag((f) => f + 1)}
                disabled={loading}
              >
                <i className="fas fa-sync me-2"></i>
                Atualizar
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4} className="mb-2">
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar placa, marca ou modelo"
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
            />
          </InputGroup>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="">Status (todos)</option>
            <option value="active">Ativo</option>
            <option value="maintenance">Manutenção</option>
            <option value="inactive">Inativo</option>
          </Form.Select>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={filters.vehicle_type}
            onChange={(e) =>
              setFilters((p) => ({ ...p, vehicle_type: e.target.value }))
            }
          >
            <option value="">Tipo (todos)</option>
            <option value="truck">Caminhão</option>
            <option value="compactor">Compactador</option>
            <option value="pickup">Caminhonete</option>
            <option value="other">Outro</option>
          </Form.Select>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" />
          <div className="small text-muted mt-2">Carregando veículos...</div>
        </div>
      )}

      <Row>
        {!loading && filteredVehicles.length === 0 && (
          <Col>
            <Alert variant="info" className="mt-3">
              <i className="fas fa-info-circle me-2"></i>
              Nenhum veículo encontrado.
            </Alert>
          </Col>
        )}
        {filteredVehicles.map((vehicle) => (
          <Col xs={12} lg={6} xl={4} key={vehicle.id} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{vehicle.license_plate}</h5>
                <div className="d-flex align-items-center gap-2">
                  {getStatusBadge(vehicle.status)}
                  {maintenanceDue(vehicle) && (
                    <Badge bg="danger" title="Manutenção vencida">
                      !
                    </Badge>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-2">
                  <h6 className="text-muted mb-1">Modelo</h6>
                  <div className="fw-bold">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </div>
                </div>

                <Row className="mb-2">
                  <Col xs={6}>
                    <small className="text-muted">Tipo</small>
                    <div className="fw-bold">
                      {TYPE_MAP[vehicle.vehicle_type] || vehicle.vehicle_type}
                    </div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Odômetro</small>
                    <div className="fw-bold">
                      {Number(vehicle.current_odometer || 0).toLocaleString()}{" "}
                      km
                    </div>
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col xs={6}>
                    <small className="text-muted">Cap. Peso</small>
                    <div className="fw-bold">
                      {Number(vehicle.capacity_weight || 0).toLocaleString()} kg
                    </div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Cap. Volume</small>
                    <div className="fw-bold">
                      {Number(vehicle.capacity_volume || 0)} m³
                    </div>
                  </Col>
                </Row>

                {/* Seção de combustível removida conforme solicitado */}

                <div className="mb-2">
                  <Row>
                    <Col xs={6}>
                      <small className="text-muted">Últ. Manutenção</small>
                      <div className="fw-bold">
                        {vehicle.last_maintenance
                          ? new Date(
                              vehicle.last_maintenance
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Próx. Manutenção</small>
                      <div className="fw-bold">
                        {vehicle.next_maintenance
                          ? new Date(
                              vehicle.next_maintenance
                            ).toLocaleDateString("pt-BR")
                          : "—"}
                      </div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="flex-fill"
                  onClick={() => openEdit(vehicle)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Editar
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="flex-fill"
                  onClick={() => openTracking(vehicle)}
                >
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Rastrear
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="flex-fill"
                  onClick={() => handleDelete(vehicle)}
                  disabled={vehicle.status === "maintenance"}
                >
                  <i className="fas fa-trash me-1"></i>
                  Remover
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Placeholder para estatísticas futuras */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Estatísticas (Em breve)
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="text-muted small">
                Integração futura: /vehicles/stats para visão geral de frota.
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <VehicleModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleModalSave}
        vehicle={editingVehicle}
      />
      <VehicleTrackingModal
        show={showTracking}
        onHide={() => setShowTracking(false)}
        vehicle={trackingVehicle}
      />
    </Container>
  );
};
export default Vehicles;
