import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';

const Routes = () => {
  // Dados simulados para as rotas
  const routes = [
    {
      id: 1,
      name: 'Rota Centro',
      description: 'Coleta no centro da cidade',
      frequency: 'Diária',
      status: 'active',
      estimatedDuration: '3h 30min',
      estimatedDistance: '25.4 km',
      collectionPoints: 45,
    },
    {
      id: 2,
      name: 'Rota Bairro Norte',
      description: 'Coleta nos bairros da região norte',
      frequency: 'Semanal',
      status: 'active',
      estimatedDuration: '2h 15min',
      estimatedDistance: '18.7 km',
      collectionPoints: 32,
    },
    {
      id: 3,
      name: 'Rota Industrial',
      description: 'Coleta na zona industrial',
      frequency: 'Quinzenal',
      status: 'maintenance',
      estimatedDuration: '4h 00min',
      estimatedDistance: '31.2 km',
      collectionPoints: 12,
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
    };

    const labels = {
      active: 'Ativa',
      inactive: 'Inativa',
      maintenance: 'Manutenção',
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fas fa-route me-2"></i>
                Gestão de Rotas
              </h2>
              <p className="text-muted">Gerencie as rotas de coleta de resíduos</p>
            </div>
            <Button variant="primary">
              <i className="fas fa-plus me-2"></i>
              Nova Rota
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        {routes.map((route) => (
          <Col xs={12} lg={6} xl={4} key={route.id} className="mb-4">
            <Card className="h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{route.name}</h5>
                {getStatusBadge(route.status)}
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{route.description}</p>
                
                <Row className="mb-3">
                  <Col xs={6}>
                    <small className="text-muted">Frequência</small>
                    <div className="fw-bold">{route.frequency}</div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Pontos</small>
                    <div className="fw-bold">{route.collectionPoints}</div>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col xs={6}>
                    <small className="text-muted">Duração</small>
                    <div className="fw-bold">{route.estimatedDuration}</div>
                  </Col>
                  <Col xs={6}>
                    <small className="text-muted">Distância</small>
                    <div className="fw-bold">{route.estimatedDistance}</div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" className="flex-fill">
                  <i className="fas fa-edit me-1"></i>
                  Editar
                </Button>
                <Button variant="outline-info" size="sm" className="flex-fill">
                  <i className="fas fa-map me-1"></i>
                  Ver Mapa
                </Button>
                <Button variant="outline-success" size="sm" className="flex-fill">
                  <i className="fas fa-optimize me-1"></i>
                  Otimizar
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Mapa placeholder */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-map me-2"></i>
                Visualização das Rotas
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="map-container bg-light d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <i className="fas fa-map fa-3x mb-3"></i>
                  <p>Mapa interativo será implementado aqui</p>
                  <small>Utilize a biblioteca Leaflet para visualização das rotas</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Routes;