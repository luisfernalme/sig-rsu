import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const PhotoGallery = ({ photos, onUpload, onSetPrimary, onDelete, loading = false }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (photo) => {
    setSelectedImage(photo);
    setShowImageModal(true);
  };

  const getPhotoTypeBadge = (type) => {
    const types = {
      location: { label: 'Localização', variant: 'primary' },
      container: { label: 'Contêiner', variant: 'info' },
      before_collection: { label: 'Antes', variant: 'warning' },
      after_collection: { label: 'Depois', variant: 'success' },
      maintenance: { label: 'Manutenção', variant: 'danger' },
      damage: { label: 'Problema', variant: 'dark' },
      other: { label: 'Outro', variant: 'secondary' },
    };
    
    const config = types[type] || types.other;
    return <Badge bg={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Carregando fotos...</div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="fas fa-images fa-3x mb-3"></i>
        <p>Nenhuma foto disponível</p>
        <p className="small">Adicione fotos para documentar este ponto de coleta</p>
      </div>
    );
  }

  return (
    <>
      <Row className="g-3">
        {photos.map((photo) => (
          <Col key={photo.id} xs={6} md={4} lg={3}>
            <Card className="photo-card h-100">
              <div 
                className="photo-thumbnail"
                onClick={() => handleImageClick(photo)}
                style={{
                  backgroundImage: `url(${photo.photo_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '150px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {photo.is_primary && (
                  <Badge 
                    bg="warning" 
                    className="position-absolute top-0 end-0 m-2"
                  >
                    <i className="fas fa-star me-1"></i>
                    Principal
                  </Badge>
                )}
              </div>
              <Card.Body className="p-2">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  {getPhotoTypeBadge(photo.photo_type)}
                  <small className="text-muted">
                    {formatDate(photo.uploaded_at)}
                  </small>
                </div>
                {photo.title && (
                  <Card.Text className="small mb-1 fw-bold">
                    {photo.title}
                  </Card.Text>
                )}
                {photo.description && (
                  <Card.Text className="small text-muted mb-2" style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {photo.description}
                  </Card.Text>
                )}
                <div className="d-flex gap-1">
                  {!photo.is_primary && onSetPrimary && (
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => onSetPrimary(photo.id)}
                      title="Definir como principal"
                    >
                      <i className="fas fa-star"></i>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDelete(photo.id)}
                      title="Excluir foto"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal de visualização da imagem */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedImage?.title || 'Foto do Ponto de Coleta'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedImage && (
            <>
              <img 
                src={selectedImage.photo_url} 
                alt={selectedImage.title}
                className="w-100 rounded mb-3"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
              <div className="mb-2">
                {getPhotoTypeBadge(selectedImage.photo_type)}
                {selectedImage.is_primary && (
                  <Badge bg="warning" className="ms-2">
                    <i className="fas fa-star me-1"></i>
                    Foto Principal
                  </Badge>
                )}
              </div>
              {selectedImage.description && (
                <p className="mb-2">{selectedImage.description}</p>
              )}
              <div className="text-muted small">
                <div><i className="fas fa-user me-2"></i>{selectedImage.uploaded_by_name}</div>
                <div><i className="fas fa-clock me-2"></i>{formatDate(selectedImage.uploaded_at)}</div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .photo-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .photo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .photo-thumbnail {
          transition: opacity 0.2s;
        }
        .photo-thumbnail:hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
};

export default PhotoGallery;
