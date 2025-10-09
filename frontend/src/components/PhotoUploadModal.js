import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

const PhotoUploadModal = ({ show, onHide, onUpload, collectionPointId, loading = false }) => {
  const [formData, setFormData] = useState({
    photo: null,
    photo_type: 'location',
    title: '',
    description: '',
    is_primary: false,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }

      setError('');
      setFormData(prev => ({ ...prev, photo: file }));
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.photo) {
      setError('Por favor, selecione uma foto.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('photo', formData.photo);
    uploadData.append('photo_type', formData.photo_type);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('is_primary', formData.is_primary);
    uploadData.append('collection_point', collectionPointId);

    await onUpload(uploadData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      photo: null,
      photo_type: 'location',
      title: '',
      description: '',
      is_primary: false,
    });
    setPreview(null);
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-camera me-2"></i>
          Adicionar Foto
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Foto *</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            <Form.Text className="text-muted">
              Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
            </Form.Text>
          </Form.Group>

          {preview && (
            <div className="mb-3 text-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="img-thumbnail"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Tipo de Foto *</Form.Label>
            <Form.Select
              name="photo_type"
              value={formData.photo_type}
              onChange={handleInputChange}
              required
            >
              <option value="location">Localização</option>
              <option value="container">Contêiner</option>
              <option value="before_collection">Antes da Coleta</option>
              <option value="after_collection">Depois da Coleta</option>
              <option value="maintenance">Manutenção</option>
              <option value="damage">Dano/Problema</option>
              <option value="other">Outro</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Ex: Vista frontal do ponto"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descrição</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Adicione detalhes sobre a foto..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleInputChange}
              label="Definir como foto principal do ponto"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            <i className="fas fa-times me-2"></i>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !formData.photo}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-upload me-2"></i>
                Enviar Foto
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PhotoUploadModal;
