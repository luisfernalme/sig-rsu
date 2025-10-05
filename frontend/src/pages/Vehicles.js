import React from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';

const Vehicles = () => {
  // Dados simulados para os veículos
  const vehicles = [
    {
      id: 1,
      licensePlate: 'ABC-1234',
      model: 'Mercedes-Benz Atego',
      brand: 'Mercedes-Benz',
      year: 2020,
      type: 'Compactador',
      status: 'active',
      capacityWeight: 8000,
      capacityVolume: 15,
      fuelLevel: 75,
      currentOdometer: 45230,
      lastMaintenance: '2024-09-15',
      nextMaintenance: '2024-12-15',
    },
    {
      id: 2,
      licensePlate: 'DEF-5678',
      model: 'Volvo VM',
      brand: 'Volvo',
      year: 2019,
      type: 'Caminhão',
      status: 'active',
      capacityWeight: 12000,
      capacityVolume: 20,
      fuelLevel: 45,
      currentOdometer: 67890,
      lastMaintenance: '2024-08-20',
      nextMaintenance: '2024-11-20',
    },
    {
      id: 3,
      licensePlate: 'GHI-9012',
      model: 'Ford Cargo',
      brand: 'Ford',
      year: 2018,
      type: 'Caminhão',
      status: 'maintenance',
      capacityWeight: 10000,
      capacityVolume: 18,
      fuelLevel: 20,
      currentOdometer: 89123,
      lastMaintenance: '2024-10-01',
      nextMaintenance: '2024-10-15',
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
    };

    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Manutenção',
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
      </Badge>
    );
  };

  const getFuelLevelVariant = (level) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'danger';
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fas fa-truck me-2"></i>
                Gestão de Veículos
              </h2>
              <p className="text-muted">Gerencie a frota de veículos de coleta</p>
            </div>
            <Button variant="primary">
              <i className="fas fa-plus me-2"></i>
              Novo Veículo
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        {vehicles.map((vehicle) => (
          <Col xs={12} lg={6} xl={4} key={vehicle.id} className="mb-4">
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{vehicle.licensePlate}</h5>
                {getStatusBadge(vehicle.status)}
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6 className="text-muted mb-1">Modelo</h6>
                  <div className="fw-bold">{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                </div>

                <Row className="mb-3">
                  <Col xs={6}>
                    <small className="text-muted">Tipo</small>
                    <div className="fw-bold">{vehicle.type}</div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Odômetro</small>
                    <div className="fw-bold">{vehicle.currentOdometer.toLocaleString()} km</div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col xs={6}>
                    <small className="text-muted">Capacidade Peso</small>
                    <div className="fw-bold">{vehicle.capacityWeight.toLocaleString()} kg</div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Capacidade Volume</small>
                    <div className="fw-bold">{vehicle.capacityVolume} m³</div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Nível de Combustível</small>
                    <small className="fw-bold">{vehicle.fuelLevel}%</small>
                  </div>
                  <ProgressBar 
                    variant={getFuelLevelVariant(vehicle.fuelLevel)} 
                    now={vehicle.fuelLevel} 
                    style={{ height: '8px' }}
                  />
                </div>

                <div className="mb-3">
                  <Row>
                    <Col xs={6}>
                      <small className="text-muted">Última Manutenção</small>
                      <div className="fw-bold">{new Date(vehicle.lastMaintenance).toLocaleDateString('pt-BR')}</div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Próxima Manutenção</small>
                      <div className="fw-bold">{new Date(vehicle.nextMaintenance).toLocaleDateString('pt-BR')}</div>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" className="flex-fill">
                  <i className="fas fa-edit me-1"></i>
                  Editar
                </Button>
                <Button variant="outline-info" size="sm" className="flex-fill">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Rastrear
                </Button>
                <Button variant="outline-success" size="sm" className="flex-fill">
                  <i className="fas fa-tools me-1"></i>
                  Manutenção
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Mapa de rastreamento */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-map-marked-alt me-2"></i>
                Rastreamento em Tempo Real
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="map-container bg-light d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <i className="fas fa-satellite-dish fa-3x mb-3"></i>
                  <p>Mapa de rastreamento GPS será implementado aqui</p>
                  <small>Visualização em tempo real da localização dos veículos</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Vehicles;