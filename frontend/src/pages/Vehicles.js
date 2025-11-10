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
  Tabs,
  Tab,
} from "react-bootstrap";
import { vehiclesAPI, driversAPI } from "../services/api";
import VehicleModal from "../components/VehicleModal";
import VehicleTrackingModal from "../components/VehicleTrackingModal";
import DriverModal from "../components/DriverModal";

const STATUS_MAP = {
  active: { variant: "success", label: "Ativo" },
  inactive: { variant: "secondary", label: "Inativo" },
  maintenance: { variant: "warning", label: "Manutenção" },
};

const DRIVER_STATUS_MAP = {
  active: { variant: "success", label: "Ativo" },
  on_leave: { variant: "warning", label: "Afastado" },
  inactive: { variant: "secondary", label: "Inativo" },
};

const LICENSE_CATEGORY_MAP = {
  B: "Categoria B",
  C: "Categoria C",
  D: "Categoria D",
  E: "Categoria E",
};

const TYPE_MAP = {
  truck: "Caminhão",
  compactor: "Compactador",
  pickup: "Caminhonete",
  other: "Outro",
};

const Vehicles = () => {
  const [activeTab, setActiveTab] = useState("vehicles");

  // Estados para veículos
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [errorVehicles, setErrorVehicles] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const [trackingVehicle, setTrackingVehicle] = useState(null);
  const [vehicleFilters, setVehicleFilters] = useState({
    search: "",
    status: "",
    vehicle_type: "",
  });
  const [refreshVehiclesFlag, setRefreshVehiclesFlag] = useState(0);

  // Estados para motoristas
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [errorDrivers, setErrorDrivers] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverFilters, setDriverFilters] = useState({
    search: "",
    status: "",
    license_category: "",
  });
  const [refreshDriversFlag, setRefreshDriversFlag] = useState(0);

  // Fetch de veículos
  const fetchVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    setErrorVehicles(null);
    try {
      const params = {};
      if (vehicleFilters.status) params.status = vehicleFilters.status;
      if (vehicleFilters.vehicle_type)
        params.vehicle_type = vehicleFilters.vehicle_type;
      if (vehicleFilters.search) params.search = vehicleFilters.search.trim();
      const data = await vehiclesAPI.getVehicles(params);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setVehicles(items);
    } catch (err) {
      setErrorVehicles("Erro ao carregar veículos.");
    } finally {
      setLoadingVehicles(false);
    }
  }, [vehicleFilters]);

  // Fetch de motoristas
  const fetchDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    setErrorDrivers(null);
    try {
      const params = {};
      if (driverFilters.status) params.status = driverFilters.status;
      if (driverFilters.license_category)
        params.license_category = driverFilters.license_category;
      if (driverFilters.search) params.search = driverFilters.search.trim();
      const data = await driversAPI.getDrivers(params);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setDrivers(items);
    } catch (err) {
      setErrorDrivers("Erro ao carregar motoristas.");
    } finally {
      setLoadingDrivers(false);
    }
  }, [driverFilters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles, refreshVehiclesFlag]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers, refreshDriversFlag]);

  // Handlers de veículos
  const openCreateVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleModal(true);
  };

  const openEditVehicle = (v) => {
    setEditingVehicle(v);
    setShowVehicleModal(true);
  };

  const openTracking = (v) => {
    setTrackingVehicle(v);
    setShowTracking(true);
  };

  const handleVehicleModalSave = async (payload) => {
    if (editingVehicle) {
      await vehiclesAPI.updateVehicle(editingVehicle.id, payload);
    } else {
      await vehiclesAPI.createVehicle(payload);
    }
    setRefreshVehiclesFlag((f) => f + 1);
  };

  const handleDeleteVehicle = async (vehicle) => {
    if (!window.confirm(`Remover veículo ${vehicle.license_plate}?`)) return;
    try {
      await vehiclesAPI.deleteVehicle(vehicle.id);
      setRefreshVehiclesFlag((f) => f + 1);
    } catch (err) {
      alert("Erro ao remover veículo.");
    }
  };

  // Handlers de motoristas
  const openCreateDriver = () => {
    setEditingDriver(null);
    setShowDriverModal(true);
  };

  const openEditDriver = (d) => {
    setEditingDriver(d);
    setShowDriverModal(true);
  };

  const handleDriverModalSave = async (payload) => {
    try {
      if (editingDriver) {
        await driversAPI.updateDriver(editingDriver.id, payload);
      } else {
        await driversAPI.createDriver(payload);
      }
      setShowDriverModal(false);
      setRefreshDriversFlag((f) => f + 1);
    } catch (err) {
      alert("Erro ao salvar motorista.");
    }
  };

  const handleDeleteDriver = async (driver) => {
    if (!window.confirm(`Remover motorista ${driver.name}?`)) return;
    try {
      await driversAPI.deleteDriver(driver.id);
      setRefreshDriversFlag((f) => f + 1);
    } catch (err) {
      alert("Erro ao remover motorista.");
    }
  };

  const filteredVehicles = useMemo(() => vehicles, [vehicles]);
  const filteredDrivers = useMemo(() => drivers, [drivers]);

  const getStatusBadge = (status) => {
    const meta = STATUS_MAP[status] || { variant: "secondary", label: status };
    return (
      <Badge bg={meta.variant} className="status-badge">
        {meta.label}
      </Badge>
    );
  };

  const getDriverStatusBadge = (status) => {
    const meta = DRIVER_STATUS_MAP[status] || {
      variant: "secondary",
      label: status,
    };
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

  const isLicenseExpiring = (driver) => {
    if (!driver.license_expiration) return false;
    try {
      const today = new Date();
      const expirationDate = new Date(driver.license_expiration);
      const daysUntilExpiration = Math.floor(
        (expirationDate - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiration <= 30 && daysUntilExpiration >= 0;
    } catch {
      return false;
    }
  };

  const isLicenseExpired = (driver) => {
    if (!driver.license_expiration) return false;
    try {
      const today = new Date();
      const expirationDate = new Date(driver.license_expiration);
      return expirationDate < today;
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
                Veículos e Motoristas
              </h2>
              <p className="text-muted mb-0">
                Gerencie a frota de veículos e motoristas
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        {/* ABA DE VEÍCULOS */}
        <Tab
          eventKey="vehicles"
          title={
            <>
              <i className="fas fa-truck me-2"></i>Veículos
            </>
          }
        >
          <Row className="mb-3">
            <Col>
              <Button variant="primary" onClick={openCreateVehicle}>
                <i className="fas fa-plus me-2"></i>
                Novo Veículo
              </Button>
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
                  value={vehicleFilters.search}
                  onChange={(e) =>
                    setVehicleFilters((p) => ({ ...p, search: e.target.value }))
                  }
                />
              </InputGroup>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Select
                value={vehicleFilters.status}
                onChange={(e) =>
                  setVehicleFilters((p) => ({ ...p, status: e.target.value }))
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
                value={vehicleFilters.vehicle_type}
                onChange={(e) =>
                  setVehicleFilters((p) => ({
                    ...p,
                    vehicle_type: e.target.value,
                  }))
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

          {errorVehicles && (
            <Alert variant="danger" className="mb-3">
              {errorVehicles}
            </Alert>
          )}
          {loadingVehicles && (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <div className="small text-muted mt-2">
                Carregando veículos...
              </div>
            </div>
          )}

          <Row>
            {!loadingVehicles && filteredVehicles.length === 0 && (
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
                          {TYPE_MAP[vehicle.vehicle_type] ||
                            vehicle.vehicle_type}
                        </div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Odômetro</small>
                        <div className="fw-bold">
                          {Number(
                            vehicle.current_odometer || 0
                          ).toLocaleString()}{" "}
                          km
                        </div>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Cap. Peso</small>
                        <div className="fw-bold">
                          {Number(
                            vehicle.capacity_weight || 0
                          ).toLocaleString()}{" "}
                          kg
                        </div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Cap. Volume</small>
                        <div className="fw-bold">
                          {Number(vehicle.capacity_volume || 0)} m³
                        </div>
                      </Col>
                    </Row>

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
                      onClick={() => openEditVehicle(vehicle)}
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
                      onClick={() => handleDeleteVehicle(vehicle)}
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
        </Tab>

        {/* ABA DE MOTORISTAS */}
        <Tab
          eventKey="drivers"
          title={
            <>
              <i className="fas fa-id-card me-2"></i>Motoristas
            </>
          }
        >
          <Row className="mb-3">
            <Col>
              <Button variant="primary" onClick={openCreateDriver}>
                <i className="fas fa-plus me-2"></i>
                Novo Motorista
              </Button>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4} className="mb-2">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar nome, CPF ou CNH"
                  value={driverFilters.search}
                  onChange={(e) =>
                    setDriverFilters((p) => ({ ...p, search: e.target.value }))
                  }
                />
              </InputGroup>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Select
                value={driverFilters.status}
                onChange={(e) =>
                  setDriverFilters((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="">Status (todos)</option>
                <option value="active">Ativo</option>
                <option value="on_leave">Afastado</option>
                <option value="inactive">Inativo</option>
              </Form.Select>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Select
                value={driverFilters.license_category}
                onChange={(e) =>
                  setDriverFilters((p) => ({
                    ...p,
                    license_category: e.target.value,
                  }))
                }
              >
                <option value="">Categoria CNH (todas)</option>
                <option value="B">Categoria B</option>
                <option value="C">Categoria C</option>
                <option value="D">Categoria D</option>
                <option value="E">Categoria E</option>
              </Form.Select>
            </Col>
          </Row>

          {errorDrivers && (
            <Alert variant="danger" className="mb-3">
              {errorDrivers}
            </Alert>
          )}
          {loadingDrivers && (
            <div className="text-center my-4">
              <Spinner animation="border" />
              <div className="small text-muted mt-2">
                Carregando motoristas...
              </div>
            </div>
          )}

          <Row>
            {!loadingDrivers && filteredDrivers.length === 0 && (
              <Col>
                <Alert variant="info" className="mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Nenhum motorista encontrado.
                </Alert>
              </Col>
            )}
            {filteredDrivers.map((driver) => (
              <Col xs={12} lg={6} xl={4} key={driver.id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{driver.name}</h5>
                    <div className="d-flex align-items-center gap-2">
                      {getDriverStatusBadge(driver.status)}
                      {isLicenseExpired(driver) && (
                        <Badge bg="danger" title="CNH vencida">
                          CNH Vencida
                        </Badge>
                      )}
                      {!isLicenseExpired(driver) &&
                        isLicenseExpiring(driver) && (
                          <Badge
                            bg="warning"
                            text="dark"
                            title="CNH expirando em breve"
                          >
                            CNH Expirando
                          </Badge>
                        )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-2">
                      <small className="text-muted">CPF</small>
                      <div className="fw-bold">{driver.cpf}</div>
                    </div>

                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Telefone</small>
                        <div className="fw-bold">{driver.phone || "—"}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Email</small>
                        <div
                          className="fw-bold text-truncate"
                          title={driver.email}
                        >
                          {driver.email || "—"}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-2">
                      <small className="text-muted">CNH</small>
                      <div className="fw-bold">
                        {driver.license_number} -{" "}
                        {LICENSE_CATEGORY_MAP[driver.license_category]}
                      </div>
                    </div>

                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Validade CNH</small>
                        <div className="fw-bold">
                          {driver.license_expiration
                            ? new Date(
                                driver.license_expiration
                              ).toLocaleDateString("pt-BR")
                            : "—"}
                        </div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Data Contratação</small>
                        <div className="fw-bold">
                          {driver.hire_date
                            ? new Date(driver.hire_date).toLocaleDateString(
                                "pt-BR"
                              )
                            : "—"}
                        </div>
                      </Col>
                    </Row>

                    {driver.address && (
                      <div className="mb-2">
                        <small className="text-muted">Endereço</small>
                        <div className="small">
                          {driver.address}
                          {driver.city && `, ${driver.city}`}
                          {driver.state && ` - ${driver.state}`}
                        </div>
                      </div>
                    )}

                    {driver.notes && (
                      <div className="mb-2">
                        <small className="text-muted">Observações</small>
                        <div className="small text-muted">{driver.notes}</div>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-fill"
                      onClick={() => openEditDriver(driver)}
                    >
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="flex-fill"
                      onClick={() => handleDeleteDriver(driver)}
                      disabled={driver.status === "active"}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Remover
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>
      </Tabs>

      <VehicleModal
        show={showVehicleModal}
        onHide={() => setShowVehicleModal(false)}
        onSave={handleVehicleModalSave}
        vehicle={editingVehicle}
      />
      <VehicleTrackingModal
        show={showTracking}
        onHide={() => setShowTracking(false)}
        vehicle={trackingVehicle}
      />
      <DriverModal
        show={showDriverModal}
        onHide={() => setShowDriverModal(false)}
        onSubmit={handleDriverModalSave}
        driver={editingDriver}
      />
    </Container>
  );
};
export default Vehicles;
