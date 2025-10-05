import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Modal, Form } from 'react-bootstrap';
import MapComponent from '../components/MapComponent';
import { collectionPointsAPI } from '../services/api';

const CollectionPoints = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [showModal, setShowModal] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Hook para carregar dados reais
  useEffect(() => {
    const fetchCollectionPoints = async () => {
      try {
        setLoading(true);
        const response = await collectionPointsAPI.getCollectionPoints();
        setCollectionPoints(response.results || response);
      } catch (error) {
        console.error('Erro ao carregar pontos:', error);
        // Fallback para dados simulados com coordenadas válidas
        setCollectionPoints([
          {
            id: 1,
            name: 'Centro da Cidade',
            code: 'CP001',
            point_type: 'container',
            address: 'Praça Central, s/n',
            neighborhood: 'Centro',
            latitude: -23.5505,
            longitude: -46.6333,
            status: 'active',
            current_fill_level: 45.5,
            capacity_volume: 5.0,
            capacity_weight: 1000,
            collection_frequency: 'daily'
          },
          {
            id: 2,
            name: 'Bairro Residencial',
            code: 'CP002',
            point_type: 'container',
            address: 'Rua das Flores, 123',
            neighborhood: 'Jardim das Flores',
            latitude: -23.5600,
            longitude: -46.6400,
            status: 'active',
            current_fill_level: 78.2,
            capacity_volume: 4.0,
            capacity_weight: 800,
            collection_frequency: 'daily'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionPoints();
  }, []);

  // Dados simulados para fallback
  const simulatedPoints = [
    {
      id: 1,
      name: 'Ponto Centro - Praça Central',
      type: 'residencial',
      address: 'Praça Central, 123 - Centro',
      neighborhood: 'Centro',
      latitude: -23.550520,
      longitude: -46.633308,
      frequency: 'diaria',
      lastCollection: '2024-10-20',
      nextCollection: '2024-10-21',
      status: 'active',
      containerType: 'lixeira_comum',
      containerCapacity: 240,
      notes: 'Ponto com alta demanda, verificar frequentemente',
    },
    {
      id: 2,
      name: 'Ponto Comercial - Av. Principal',
      type: 'comercial',
      address: 'Av. Principal, 456 - Centro',
      neighborhood: 'Centro',
      latitude: -23.551520,
      longitude: -46.634308,
      frequency: 'bi_diaria',
      lastCollection: '2024-10-20',
      nextCollection: '2024-10-21',
      status: 'active',
      containerType: 'container_grande',
      containerCapacity: 1100,
      notes: 'Estabelecimentos comerciais da região',
    },
    {
      id: 3,
      name: 'Ponto Residencial - Bairro Norte',
      type: 'residencial',
      address: 'Rua das Flores, 789 - Bairro Norte',
      neighborhood: 'Bairro Norte',
      latitude: -23.549520,
      longitude: -46.632308,
      frequency: 'alternada',
      lastCollection: '2024-10-19',
      nextCollection: '2024-10-22',
      status: 'maintenance',
      containerType: 'lixeira_comum',
      containerCapacity: 240,
      notes: 'Container danificado, aguardando reparo',
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      full: 'danger',
    };

    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      maintenance: 'Manutenção',
      full: 'Cheio',
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const variants = {
      residencial: 'primary',
      comercial: 'info',
      industrial: 'warning',
      especial: 'danger',
    };

    const labels = {
      residencial: 'Residencial',
      comercial: 'Comercial',
      industrial: 'Industrial',
      especial: 'Especial',
    };

    return (
      <Badge bg={variants[type]} className="me-2">
        {labels[type]}
      </Badge>
    );
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      diaria: 'Diária',
      bi_diaria: 'Bi-diária',
      alternada: 'Alternada',
      semanal: 'Semanal',
    };
    return labels[frequency] || frequency;
  };

  const getContainerTypeLabel = (type) => {
    const labels = {
      lixeira_comum: 'Lixeira Comum',
      container_grande: 'Container Grande',
      container_especial: 'Container Especial',
      compactador: 'Compactador',
    };
    return labels[type] || type;
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fas fa-map-marker-alt me-2"></i>
                Pontos de Coleta
              </h2>
              <p className="text-muted">Gerencie os pontos de coleta de resíduos</p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-plus me-2"></i>
              Novo Ponto
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="map" title={<><i className="fas fa-map me-2"></i>Mapa</>}>
          <Card>
            <Card.Body>
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : (
                <MapComponent
                  center={[-23.5505, -46.6333]}
                  zoom={12}
                  points={collectionPoints.filter(point => 
                    point.latitude && point.longitude && 
                    !isNaN(point.latitude) && !isNaN(point.longitude)
                  )}
                  onPointClick={setSelectedPoint}
                  style={{ height: '500px', width: '100%' }}
                />
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="list" title={<><i className="fas fa-list me-2"></i>Lista</>}>
          <Row>
            {collectionPoints.map((point) => (
              <Col xs={12} lg={6} xl={4} key={point.id} className="mb-4">
                <Card className="h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      {getTypeBadge(point.type)}
                      {getStatusBadge(point.status)}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <h5 className="card-title">{point.name}</h5>
                    
                    <div className="mb-3">
                      <small className="text-muted">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {point.address}
                      </small>
                    </div>

                    <Row className="mb-3">
                      <Col xs={6}>
                        <small className="text-muted">Frequência</small>
                        <div className="fw-bold">{getFrequencyLabel(point.frequency)}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Container</small>
                        <div className="fw-bold">{getContainerTypeLabel(point.containerType)}</div>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col xs={6}>
                        <small className="text-muted">Última Coleta</small>
                        <div className="fw-bold">{new Date(point.lastCollection).toLocaleDateString('pt-BR')}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Próxima Coleta</small>
                        <div className="fw-bold">{new Date(point.nextCollection).toLocaleDateString('pt-BR')}</div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <small className="text-muted">Capacidade</small>
                      <div className="fw-bold">{point.containerCapacity}L</div>
                    </div>

                    {point.notes && (
                      <div className="mb-3">
                        <small className="text-muted">Observações</small>
                        <div className="small">{point.notes}</div>
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" className="flex-fill">
                      <i className="fas fa-edit me-1"></i>
                      Editar
                    </Button>
                    <Button variant="outline-info" size="sm" className="flex-fill">
                      <i className="fas fa-map me-1"></i>
                      Ver no Mapa
                    </Button>
                    <Button variant="outline-success" size="sm" className="flex-fill">
                      <i className="fas fa-check me-1"></i>
                      Coletado
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>

        <Tab eventKey="schedule" title={<><i className="fas fa-calendar me-2"></i>Cronograma</>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Cronograma de Coletas</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Ponto</th>
                      <th>Tipo</th>
                      <th>Frequência</th>
                      <th>Última Coleta</th>
                      <th>Próxima Coleta</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionPoints.map((point) => (
                      <tr key={point.id}>
                        <td>
                          <div className="fw-bold">{point.name}</div>
                          <small className="text-muted">{point.neighborhood}</small>
                        </td>
                        <td>{getTypeBadge(point.type)}</td>
                        <td>{getFrequencyLabel(point.frequency)}</td>
                        <td>{new Date(point.lastCollection).toLocaleDateString('pt-BR')}</td>
                        <td>{new Date(point.nextCollection).toLocaleDateString('pt-BR')}</td>
                        <td>{getStatusBadge(point.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button variant="outline-primary" size="sm">
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button variant="outline-info" size="sm">
                              <i className="fas fa-map"></i>
                            </Button>
                            <Button variant="outline-success" size="sm">
                              <i className="fas fa-check"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal para novo ponto */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Novo Ponto de Coleta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Ponto</Form.Label>
                  <Form.Control type="text" placeholder="Ex: Ponto Centro - Praça Central" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select>
                    <option value="">Selecione o tipo</option>
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="especial">Especial</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control type="text" placeholder="Endereço completo" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bairro</Form.Label>
                  <Form.Control type="text" placeholder="Bairro" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control type="number" step="any" placeholder="-23.550520" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control type="number" step="any" placeholder="-46.633308" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Frequência de Coleta</Form.Label>
                  <Form.Select>
                    <option value="">Selecione a frequência</option>
                    <option value="diaria">Diária</option>
                    <option value="bi_diaria">Bi-diária</option>
                    <option value="alternada">Alternada</option>
                    <option value="semanal">Semanal</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Container</Form.Label>
                  <Form.Select>
                    <option value="">Selecione o container</option>
                    <option value="lixeira_comum">Lixeira Comum</option>
                    <option value="container_grande">Container Grande</option>
                    <option value="container_especial">Container Especial</option>
                    <option value="compactador">Compactador</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Capacidade (litros)</Form.Label>
              <Form.Control type="number" placeholder="240" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="Observações adicionais sobre o ponto de coleta" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary">
            <i className="fas fa-save me-2"></i>
            Salvar Ponto
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CollectionPoints;