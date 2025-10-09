import React from 'react';
import { Card, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const CollectionHistory = ({ collections, loading = false }) => {
  const getStatusBadge = (status) => {
    const statuses = {
      collected: { label: 'Coletado', variant: 'success', icon: 'check-circle' },
      partially_collected: { label: 'Parcial', variant: 'warning', icon: 'exclamation-circle' },
      not_collected: { label: 'Não Coletado', variant: 'danger', icon: 'times-circle' },
      inaccessible: { label: 'Inacessível', variant: 'secondary', icon: 'ban' },
    };
    
    const config = statuses[status] || statuses.collected;
    return (
      <Badge bg={config.variant}>
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Carregando histórico...</div>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="fas fa-history fa-3x mb-3"></i>
        <p>Nenhuma coleta registrada</p>
        <p className="small">O histórico de coletas aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="collection-history-timeline">
      {collections.map((collection, index) => (
        <div key={collection.id} className="timeline-item">
          <div className="timeline-marker">
            <div className="timeline-dot"></div>
            {index < collections.length - 1 && <div className="timeline-line"></div>}
          </div>
          
          <Card className="timeline-card mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">
                    <i className="fas fa-calendar-alt me-2 text-primary"></i>
                    {formatDate(collection.collection_date)}
                    <span className="ms-2 text-muted small">
                      {formatTime(collection.collection_date)}
                    </span>
                  </h6>
                  <small className="text-muted">{getDaysAgo(collection.collection_date)}</small>
                </div>
                {getStatusBadge(collection.status)}
              </div>

              {collection.route_execution_info && (
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <small className="text-muted d-block">
                        <i className="fas fa-route me-1"></i>
                        Rota:
                      </small>
                      <strong>{collection.route_execution_info.route_name}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">
                        <i className="fas fa-truck me-1"></i>
                        Veículo:
                      </small>
                      <strong>{collection.route_execution_info.vehicle_plate}</strong>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">
                        <i className="fas fa-user me-1"></i>
                        Motorista:
                      </small>
                      <strong>{collection.route_execution_info.driver_name}</strong>
                    </div>
                  </div>
                </div>
              )}

              {(collection.weight_collected || collection.volume_collected) && (
                <div className="row g-2 mb-3">
                  {collection.weight_collected && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-weight-hanging text-primary me-2"></i>
                        <div>
                          <small className="text-muted d-block">Peso Coletado</small>
                          <strong>{collection.weight_collected} kg</strong>
                        </div>
                      </div>
                    </div>
                  )}
                  {collection.volume_collected && (
                    <div className="col-md-6">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-box text-primary me-2"></i>
                        <div>
                          <small className="text-muted d-block">Volume Coletado</small>
                          <strong>{collection.volume_collected} m³</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(collection.fill_level_before != null || collection.fill_level_after != null) && (
                <div className="mb-3">
                  <div className="row g-2">
                    {collection.fill_level_before != null && (
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1">
                          Nível Antes: <strong>{collection.fill_level_before}%</strong>
                        </small>
                        <ProgressBar 
                          now={collection.fill_level_before} 
                          variant={collection.fill_level_before > 80 ? 'danger' : collection.fill_level_before > 60 ? 'warning' : 'success'}
                          style={{ height: '8px' }}
                        />
                      </div>
                    )}
                    {collection.fill_level_after != null && (
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1">
                          Nível Depois: <strong>{collection.fill_level_after}%</strong>
                        </small>
                        <ProgressBar 
                          now={collection.fill_level_after} 
                          variant={collection.fill_level_after > 80 ? 'danger' : collection.fill_level_after > 60 ? 'warning' : 'success'}
                          style={{ height: '8px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {collection.notes && (
                <div className="alert alert-info mb-2 py-2">
                  <i className="fas fa-sticky-note me-2"></i>
                  <small>{collection.notes}</small>
                </div>
              )}

              {collection.photo && (
                <div className="mt-2">
                  <img 
                    src={collection.photo} 
                    alt="Foto da coleta"
                    className="img-thumbnail"
                    style={{ maxHeight: '150px', cursor: 'pointer' }}
                    onClick={() => window.open(collection.photo, '_blank')}
                  />
                </div>
              )}

              <div className="text-muted small mt-2">
                <i className="fas fa-user me-1"></i>
                Registrado por: {collection.collected_by_name}
              </div>
            </Card.Body>
          </Card>
        </div>
      ))}

      <style jsx>{`
        .collection-history-timeline {
          position: relative;
        }
        
        .timeline-item {
          display: flex;
          position: relative;
        }
        
        .timeline-marker {
          position: relative;
          flex-shrink: 0;
          width: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .timeline-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          z-index: 2;
          margin-top: 8px;
        }
        
        .timeline-line {
          width: 2px;
          flex: 1;
          background: linear-gradient(180deg, #667eea 0%, #e9ecef 100%);
          margin-top: 4px;
        }
        
        .timeline-card {
          flex: 1;
          transition: all 0.3s;
          border: 1px solid #e9ecef;
        }
        
        .timeline-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateX(4px);
          border-color: #667eea;
        }
      `}</style>
    </div>
  );
};

export default CollectionHistory;
