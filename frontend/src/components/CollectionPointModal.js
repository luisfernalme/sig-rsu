import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import MapComponent from './MapComponent';

const CollectionPointModal = ({ 
  show, 
  onHide, 
  onSave, 
  editPoint = null,
  preselectedLocation = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: editPoint?.name || '',
    code: editPoint?.code || '',
    point_type: editPoint?.point_type || 'container',
    address: editPoint?.address || '',
    neighborhood: editPoint?.neighborhood || '',
    capacity_volume: editPoint?.capacity_volume || '',
    capacity_weight: editPoint?.capacity_weight || '',
    collection_frequency: editPoint?.collection_frequency || 'daily',
    status: editPoint?.status || 'active'
  });

  const [selectedLocation, setSelectedLocation] = useState(
    editPoint?.latitude_read && editPoint?.longitude_read 
      ? { latitude: editPoint.latitude_read, longitude: editPoint.longitude_read }
      : preselectedLocation
  );

  const [showLocationHelp, setShowLocationHelp] = useState(false);

  // Atualizar localização quando preselectedLocation mudar
  React.useEffect(() => {
    if (preselectedLocation) {
      setSelectedLocation(preselectedLocation);
      setShowLocationHelp(false);
    }
  }, [preselectedLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMapClick = (location) => {
    setSelectedLocation(location);
    setShowLocationHelp(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      setShowLocationHelp(true);
      return;
    }

    const pointData = {
      ...formData,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude
    };

    onSave(pointData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      point_type: 'container',
      address: '',
      neighborhood: '',
      capacity_volume: '',
      capacity_weight: '',
      collection_frequency: 'daily',
      status: 'active'
    });
    setSelectedLocation(null);
    setShowLocationHelp(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-map-marker-alt me-2"></i>
          {editPoint ? 'Editar Ponto de Coleta' : 'Novo Ponto de Coleta'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            {/* Formulário à esquerda */}
            <Col md={6}>
              <h5 className="mb-3">
                <i className="fas fa-info-circle me-2"></i>
                Informações Básicas
              </h5>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nome do Ponto *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Centro da Cidade"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Código *</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Ex: CP001"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select
                      name="point_type"
                      value={formData.point_type}
                      onChange={handleInputChange}
                    >
                      <option value="container">Contêiner</option>
                      <option value="bin">Lixeira</option>
                      <option value="dumpster">Caçamba</option>
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="maintenance">Em Manutenção</option>
                      <option value="full">Cheio</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Endereço</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ex: Rua das Flores, 123"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Bairro</Form.Label>
                <Form.Control
                  type="text"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleInputChange}
                  placeholder="Ex: Centro"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacidade Volume (m³)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="capacity_volume"
                      value={formData.capacity_volume}
                      onChange={handleInputChange}
                      placeholder="Ex: 5.0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacidade Peso (kg)</Form.Label>
                    <Form.Control
                      type="number"
                      name="capacity_weight"
                      value={formData.capacity_weight}
                      onChange={handleInputChange}
                      placeholder="Ex: 1000"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Frequência de Coleta</Form.Label>
                <Form.Select
                  name="collection_frequency"
                  value={formData.collection_frequency}
                  onChange={handleInputChange}
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quinzenal</option>
                  <option value="monthly">Mensal</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Mapa à direita */}
            <Col md={6}>
              <h5 className="mb-3">
                <i className="fas fa-map-marked-alt me-2"></i>
                Localização no Mapa
              </h5>

              {!editPoint && !selectedLocation && (
                <Alert variant="info" className="mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  A localização foi definida quando você clicou no mapa. Você pode ajustá-la clicando em um novo local.
                </Alert>
              )}

              {showLocationHelp && (
                <Alert variant="warning" className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Selecione uma localização!</strong> Clique no mapa para definir onde o ponto de coleta será localizado.
                </Alert>
              )}

              {selectedLocation && (
                <Alert variant="success" className="mb-3">
                  <i className="fas fa-map-pin me-2"></i>
                  <strong>Localização selecionada:</strong><br/>
                  Latitude: {selectedLocation.latitude.toFixed(6)}<br/>
                  Longitude: {selectedLocation.longitude.toFixed(6)}
                </Alert>
              )}

              <div className="border rounded p-2" style={{ backgroundColor: '#f8f9fa' }}>
                <small className="text-muted d-block mb-2">
                  <i className="fas fa-mouse-pointer me-1"></i>
                  {editPoint 
                    ? 'Clique no mapa para ajustar a localização do ponto de coleta' 
                    : 'Clique no mapa para ajustar a localização, se necessário'
                  }
                </small>
                
                <MapComponent
                  center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : [-23.5505, -46.6333]}
                  zoom={selectedLocation ? 15 : 12}
                  points={[]}
                  onMapClick={handleMapClick}
                  selectedLocation={selectedLocation}
                  style={{ height: '400px', width: '100%' }}
                />
              </div>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            <i className="fas fa-times me-2"></i>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                {editPoint ? 'Atualizar' : 'Criar'} Ponto
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CollectionPointModal;