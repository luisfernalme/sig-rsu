import React, { useState, useEffect } from "react";
import { Modal, Tabs, Tab, Button, Spinner, Alert } from "react-bootstrap";
import PhotoGallery from "./PhotoGallery";
import CollectionHistory from "./CollectionHistory";
import PhotoUploadModal from "./PhotoUploadModal";
import { collectionPointsAPI } from "../services/api";
import toast from "react-hot-toast";

const PointHistoryModal = ({ show, onHide, collectionPoint }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (show && collectionPoint) {
      loadData();
    }
  }, [show, collectionPoint]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar histórico e fotos em paralelo
      const [historyData, photosData] = await Promise.all([
        collectionPointsAPI.getCollectionHistory(collectionPoint.id, {
          days: 90,
        }),
        collectionPointsAPI.getPhotos(collectionPoint.id),
      ]);

      setCollections(historyData);
      setPhotos(photosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do ponto de coleta.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (photoData) => {
    setUploadLoading(true);
    try {
      await collectionPointsAPI.uploadPhoto(collectionPoint.id, photoData);
      toast.success("Foto enviada com sucesso!");
      await loadData(); // Recarregar fotos
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await collectionPointsAPI.setPrimaryPhoto(photoId);
      toast.success("Foto definida como principal!");
      await loadData();
    } catch (error) {
      console.error("Erro ao definir foto principal:", error);
      toast.error("Erro ao definir foto principal.");
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (window.confirm("Tem certeza que deseja excluir esta foto?")) {
      try {
        await collectionPointsAPI.deletePhoto(photoId);
        toast.success("Foto excluída com sucesso!");
        await loadData();
      } catch (error) {
        console.error("Erro ao excluir foto:", error);
        toast.error("Erro ao excluir foto.");
      }
    }
  };

  if (!collectionPoint) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-history me-2"></i>
            Histórico e Fotos - {collectionPoint.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-map-marker-alt text-primary me-2"></i>
              <div>
                <strong>{collectionPoint.address}</strong>
                <div className="small text-muted">
                  {collectionPoint.neighborhood}
                </div>
              </div>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab
              eventKey="history"
              title={
                <>
                  <i className="fas fa-history me-2"></i>
                  Histórico de Coletas
                  {collections.length > 0 && (
                    <span className="badge bg-primary ms-2">
                      {collections.length}
                    </span>
                  )}
                </>
              }
            >
              <div className="mt-3">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2">Carregando histórico...</div>
                  </div>
                ) : (
                  <>
                    {collections.length > 0 && (
                      <Alert variant="info" className="mb-3">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Últimos 90 dias:</strong> {collections.length}{" "}
                        coletas realizadas
                      </Alert>
                    )}
                    <CollectionHistory
                      collections={collections}
                      loading={loading}
                    />
                  </>
                )}
              </div>
            </Tab>

            <Tab
              eventKey="photos"
              title={
                <>
                  <i className="fas fa-images me-2"></i>
                  Galeria de Fotos
                  {photos.length > 0 && (
                    <span className="badge bg-success ms-2">
                      {photos.length}
                    </span>
                  )}
                </>
              }
            >
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    <i className="fas fa-camera me-2"></i>
                    Fotos do Ponto de Coleta
                  </h6>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowPhotoUpload(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Adicionar Foto
                  </Button>
                </div>

                <PhotoGallery
                  photos={photos}
                  onSetPrimary={handleSetPrimaryPhoto}
                  onDelete={handleDeletePhoto}
                  loading={loading}
                />
              </div>
            </Tab>

            <Tab
              eventKey="stats"
              title={
                <>
                  <i className="fas fa-chart-bar me-2"></i>
                  Estatísticas
                </>
              }
            >
              <div className="mt-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title text-muted">
                          <i className="fas fa-calendar-check me-2"></i>
                          Total de Coletas
                        </h6>
                        <h3 className="mb-0">{collections.length}</h3>
                        <small className="text-muted">Últimos 90 dias</small>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title text-muted">
                          <i className="fas fa-images me-2"></i>
                          Total de Fotos
                        </h6>
                        <h3 className="mb-0">{photos.length}</h3>
                        <small className="text-muted">Galeria completa</small>
                      </div>
                    </div>
                  </div>

                  {collections.length > 0 && (
                    <>
                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-title text-muted">
                              <i className="fas fa-weight-hanging me-2"></i>
                              Peso Total Coletado
                            </h6>
                            <h3 className="mb-0">
                              {collections
                                .reduce(
                                  (sum, c) => sum + (c.weight_collected || 0),
                                  0
                                )
                                .toFixed(2)}{" "}
                              kg
                            </h3>
                            <small className="text-muted">
                              Últimos 90 dias
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-title text-muted">
                              <i className="fas fa-check-circle me-2"></i>
                              Taxa de Sucesso
                            </h6>
                            <h3 className="mb-0">
                              {(
                                (collections.filter(
                                  (c) => c.status === "collected"
                                ).length /
                                  collections.length) *
                                100
                              ).toFixed(1)}
                              %
                            </h3>
                            <small className="text-muted">
                              {
                                collections.filter(
                                  (c) => c.status === "collected"
                                ).length
                              }{" "}
                              de {collections.length} coletas
                            </small>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">
                          <i className="fas fa-info-circle me-2"></i>
                          Informações do Ponto
                        </h6>
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <small className="text-muted">Código:</small>
                            <div>
                              <strong>{collectionPoint.code}</strong>
                            </div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted">Tipo:</small>
                            <div>
                              <strong>
                                {collectionPoint.type_display ||
                                  collectionPoint.point_type}
                              </strong>
                            </div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <small className="text-muted">
                              Frequência de Coleta:
                            </small>
                            <div>
                              <strong>
                                {collectionPoint.frequency_display ||
                                  collectionPoint.collection_frequency}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            <i className="fas fa-times me-2"></i>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Upload de Foto */}
      <PhotoUploadModal
        show={showPhotoUpload}
        onHide={() => setShowPhotoUpload(false)}
        onUpload={handlePhotoUpload}
        collectionPointId={collectionPoint?.id}
        loading={uploadLoading}
      />
    </>
  );
};

export default PointHistoryModal;
