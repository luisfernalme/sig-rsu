import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Table, Spinner } from 'react-bootstrap';
import MapComponent from '../components/MapComponent';
import CollectionPointModal from '../components/CollectionPointModal';
import { collectionPointsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CollectionPoints = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [showModal, setShowModal] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

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

  const handleCreatePoint = () => {
    setEditingPoint(null);
    setShowModal(true);
  };

  const handleEditPoint = (point) => {
    setEditingPoint(point);
    setShowModal(true);
  };

  const handleSavePoint = async (pointData) => {
    try {
      setSaveLoading(true);
      
      if (editingPoint) {
        // Atualizar ponto existente
        await collectionPointsAPI.updateCollectionPoint(editingPoint.id, pointData);
        toast.success('Ponto de coleta atualizado com sucesso!');
      } else {
        // Criar novo ponto
        await collectionPointsAPI.createCollectionPoint(pointData);
        toast.success('Ponto de coleta criado com sucesso!');
      }
      
      // Recarregar lista
      const response = await collectionPointsAPI.getCollectionPoints();
      setCollectionPoints(response.results || response);
      
      setShowModal(false);
      setEditingPoint(null);
    } catch (error) {
      console.error('Erro ao salvar ponto:', error);
      toast.error('Erro ao salvar ponto de coleta. Tente novamente.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePoint = async (pointId) => {
    if (window.confirm('Tem certeza que deseja excluir este ponto de coleta?')) {
      try {
        await collectionPointsAPI.deleteCollectionPoint(pointId);
        toast.success('Ponto de coleta excluído com sucesso!');
        
        // Remover da lista local
        setCollectionPoints(prev => prev.filter(point => point.id !== pointId));
      } catch (error) {
        console.error('Erro ao excluir ponto:', error);
        toast.error('Erro ao excluir ponto de coleta.');
      }
    }
  };

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
            <Button variant="primary" onClick={handleCreatePoint}>
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

      {/* Modal para adicionar/editar ponto */}
      <CollectionPointModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSavePoint}
        editPoint={editingPoint}
        loading={saveLoading}
      />
    </Container>
  );
};

export default CollectionPoints;