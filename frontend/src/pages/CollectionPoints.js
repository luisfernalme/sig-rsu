import React, { useState, useEffect } from "react";
import {
  Button,
  Badge,
  Form,
  InputGroup,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import MapComponent from "../components/MapComponent";
import CollectionPointModal from "../components/CollectionPointModal";
import PointHistoryModal from "../components/PointHistoryModal";
import { collectionPointsAPI } from "../services/api";
import toast from "react-hot-toast";
import "./CollectionPoints.css";

const CollectionPoints = () => {
  const [showModal, setShowModal] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [centerOnPoint, setCenterOnPoint] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPoint, setHistoryPoint] = useState(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedLocationForNewPoint, setSelectedLocationForNewPoint] =
    useState(null);

  // Hook para carregar dados reais
  useEffect(() => {
    const fetchCollectionPoints = async () => {
      try {
        setLoading(true);
        const response = await collectionPointsAPI.getCollectionPoints();
        setCollectionPoints(response.results || response);
      } catch (error) {
        console.error("Erro ao carregar pontos:", error);
        // Fallback para dados simulados com coordenadas válidas
        setCollectionPoints([
          {
            id: 1,
            name: "Centro da Cidade",
            code: "CP001",
            point_type: "container",
            address: "Praça Central, s/n",
            neighborhood: "Centro",
            latitude: -23.5505,
            longitude: -46.6333,
            status: "active",
            current_fill_level: 45.5,
            capacity_volume: 5.0,
            capacity_weight: 1000,
            collection_frequency: "daily",
          },
          {
            id: 2,
            name: "Bairro Residencial",
            code: "CP002",
            point_type: "container",
            address: "Rua das Flores, 123",
            neighborhood: "Jardim das Flores",
            latitude: -23.56,
            longitude: -46.64,
            status: "active",
            current_fill_level: 78.2,
            capacity_volume: 4.0,
            capacity_weight: 800,
            collection_frequency: "daily",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionPoints();
  }, []);

  const handleCreatePoint = () => {
    setEditingPoint(null);
    setIsSelectingLocation(true);
    setSelectedLocationForNewPoint(null);
    toast.success(
      "Clique no mapa para selecionar a localização do novo ponto de coleta"
    );
  };

  const handleMapClickForNewPoint = (location) => {
    if (isSelectingLocation) {
      setSelectedLocationForNewPoint(location);
      setIsSelectingLocation(false);
      setShowModal(true);
      toast.success(
        "Localização selecionada! Preencha as informações do ponto."
      );
    }
  };

  const handleCancelLocationSelection = () => {
    setIsSelectingLocation(false);
    setSelectedLocationForNewPoint(null);
  };

  const handleEditPoint = (point) => {
    setEditingPoint(point);
    setSelectedLocationForNewPoint(null);
    setIsSelectingLocation(false);
    setShowModal(true);
  };

  const handleSavePoint = async (pointData) => {
    try {
      setSaveLoading(true);

      if (editingPoint) {
        // Atualizar ponto existente
        await collectionPointsAPI.updateCollectionPoint(
          editingPoint.id,
          pointData
        );
        toast.success("Ponto de coleta atualizado com sucesso!");
      } else {
        // Criar novo ponto
        await collectionPointsAPI.createCollectionPoint(pointData);
        toast.success("Ponto de coleta criado com sucesso!");
      }

      // Recarregar lista
      const response = await collectionPointsAPI.getCollectionPoints();
      setCollectionPoints(response.results || response);

      setShowModal(false);
      setEditingPoint(null);
      setSelectedLocationForNewPoint(null);
      setIsSelectingLocation(false);
    } catch (error) {
      console.error("Erro ao salvar ponto:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Erro ao salvar ponto de coleta. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeletePoint = async (pointId) => {
    if (
      window.confirm("Tem certeza que deseja excluir este ponto de coleta?")
    ) {
      try {
        await collectionPointsAPI.deleteCollectionPoint(pointId);
        toast.success("Ponto de coleta excluído com sucesso!");

        // Remover da lista local
        setCollectionPoints((prev) =>
          prev.filter((point) => point.id !== pointId)
        );
      } catch (error) {
        console.error("Erro ao excluir ponto:", error);
        toast.error("Erro ao excluir ponto de coleta.");
      }
    }
  };

  const handleViewOnMap = (point) => {
    // Centralizar o ponto no mapa Leaflet
    const lat = point.latitude_read || point.latitude || point.lat;
    const lng = point.longitude_read || point.longitude || point.lng;

    if (lat && lng) {
      // Resetar primeiro para garantir que o useEffect seja acionado mesmo com o mesmo ponto
      setCenterOnPoint(null);
      // Usar setTimeout para garantir que o state foi resetado antes de setar o novo valor
      setTimeout(() => {
        setCenterOnPoint({
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
        });
        setSelectedPoint(point);
      }, 10);
      toast.success("Ponto centralizado no mapa!");
    } else {
      toast.error("Coordenadas não disponíveis para este ponto.");
    }
  };

  const handleToggleStatus = async (point) => {
    const newStatus = point.status === "active" ? "inactive" : "active";

    try {
      const updatedData = {
        ...point,
        status: newStatus,
      };

      await collectionPointsAPI.updateCollectionPoint(point.id, updatedData);

      // Atualizar na lista local
      setCollectionPoints((prev) =>
        prev.map((p) => (p.id === point.id ? { ...p, status: newStatus } : p))
      );

      const statusLabel = newStatus === "active" ? "ativado" : "desativado";
      toast.success(`Ponto ${statusLabel} com sucesso!`);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status do ponto.");
    }
  };

  const handleMarkAsCollected = async (point) => {
    try {
      // Registrar coleta
      const collectionData = {
        collection_point: point.id,
        collection_date: new Date().toISOString(),
        status: "collected",
        fill_level_before: point.current_fill_level || 0,
        fill_level_after: 0,
        notes: "Coleta registrada via interface web",
      };

      await collectionPointsAPI.recordCollection(point.id, collectionData);
      toast.success("Coleta registrada com sucesso!");

      // Atualizar lista
      const response = await collectionPointsAPI.getCollectionPoints();
      setCollectionPoints(response.results || response);
    } catch (error) {
      console.error("Erro ao registrar coleta:", error);
      toast.error("Erro ao registrar coleta.");
    }
  };

  const handleViewHistory = (point) => {
    setHistoryPoint(point);
    setShowHistoryModal(true);
  };

  // Dados simulados para fallback
  const simulatedPoints = [
    {
      id: 1,
      name: "Ponto Centro - Praça Central",
      type: "residencial",
      address: "Praça Central, 123 - Centro",
      neighborhood: "Centro",
      latitude: -23.55052,
      longitude: -46.633308,
      frequency: "diaria",
      lastCollection: "2024-10-20",
      nextCollection: "2024-10-21",
      status: "active",
      containerType: "lixeira_comum",
      containerCapacity: 240,
      notes: "Ponto com alta demanda, verificar frequentemente",
    },
    {
      id: 2,
      name: "Ponto Comercial - Av. Principal",
      type: "comercial",
      address: "Av. Principal, 456 - Centro",
      neighborhood: "Centro",
      latitude: -23.55152,
      longitude: -46.634308,
      frequency: "bi_diaria",
      lastCollection: "2024-10-20",
      nextCollection: "2024-10-21",
      status: "active",
      containerType: "container_grande",
      containerCapacity: 1100,
      notes: "Estabelecimentos comerciais da região",
    },
    {
      id: 3,
      name: "Ponto Residencial - Bairro Norte",
      type: "residencial",
      address: "Rua das Flores, 789 - Bairro Norte",
      neighborhood: "Bairro Norte",
      latitude: -23.54952,
      longitude: -46.632308,
      frequency: "alternada",
      lastCollection: "2024-10-19",
      nextCollection: "2024-10-22",
      status: "maintenance",
      containerType: "lixeira_comum",
      containerCapacity: 240,
      notes: "Container danificado, aguardando reparo",
    },
  ];

  const getStatusBadge = (status) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      maintenance: "warning",
      full: "danger",
    };

    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      maintenance: "Manutenção",
      full: "Cheio",
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const variants = {
      container: "primary",
      bin: "info",
      dumpster: "warning",
      residential: "success",
      commercial: "danger",
    };

    const labels = {
      container: "Contêiner",
      bin: "Lixeira",
      dumpster: "Caçamba",
      residential: "Residencial",
      commercial: "Comercial",
    };

    return (
      <Badge bg={variants[type] || "secondary"} className="me-2">
        {labels[type] || type}
      </Badge>
    );
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Diária",
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return labels[frequency] || frequency;
  };

  const getContainerTypeLabel = (type) => {
    const labels = {
      lixeira_comum: "Lixeira Comum",
      container_grande: "Container Grande",
      container_especial: "Container Especial",
      compactador: "Compactador",
    };
    return labels[type] || type;
  };

  // Filtrar pontos
  const filteredPoints = collectionPoints.filter((point) => {
    const matchesSearch =
      point.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || point.status === filterStatus;
    const matchesType =
      filterType === "all" ||
      point.point_type === filterType ||
      point.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Estatísticas rápidas
  const stats = {
    total: collectionPoints.length,
    active: collectionPoints.filter((p) => p.status === "active").length,
    inactive: collectionPoints.filter((p) => p.status === "inactive").length,
    maintenance: collectionPoints.filter((p) => p.status === "maintenance")
      .length,
    full: collectionPoints.filter((p) => p.status === "full").length,
  };

  return (
    <div className="collection-points-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i className="fas fa-map-marker-alt me-2"></i>
              Pontos de Coleta
            </h5>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white p-0"
            >
              <i
                className={`fas fa-chevron-${sidebarOpen ? "left" : "right"}`}
              ></i>
            </Button>
          </div>

          {sidebarOpen && (
            <>
              {/* Botão Novo Ponto */}
              <Button
                variant="light"
                className="w-100 mb-3"
                onClick={handleCreatePoint}
              >
                <i className="fas fa-plus me-2"></i>
                Novo Ponto
              </Button>

              {/* Estatísticas */}
              <div className="stats-grid mb-3">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-success">{stats.active}</div>
                  <div className="stat-label">Ativos</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-warning">
                    {stats.maintenance}
                  </div>
                  <div className="stat-label">Manutenção</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value text-danger">{stats.full}</div>
                  <div className="stat-label">Cheios</div>
                </div>
              </div>

              {/* Busca */}
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar pontos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Filtros */}
              <div className="mb-3">
                <Form.Label className="small">Status</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="full">Cheio</option>
                </Form.Select>
              </div>

              <div className="mb-3">
                <Form.Label className="small">Tipo</Form.Label>
                <Form.Select
                  size="sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="container">Contêiner</option>
                  <option value="bin">Lixeira</option>
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                </Form.Select>
              </div>

              <hr className="border-light" />
            </>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-content">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">Carregando...</div>
              </div>
            ) : (
              <ListGroup variant="flush">
                {filteredPoints.map((point) => (
                  <ListGroup.Item
                    key={point.id}
                    action
                    active={selectedPoint?.id === point.id}
                    onClick={() => setSelectedPoint(point)}
                    className="point-item"
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1">
                        <div className="fw-bold">{point.name}</div>
                        <div className="small text-muted">
                          {point.code || `#${point.id}`}
                        </div>
                      </div>
                      <div>{getTypeBadge(point.point_type || point.type)}</div>
                    </div>

                    <div className="small mb-2">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      {point.address}
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      {getStatusBadge(point.status)}
                      {point.current_fill_level != null && (
                        <div className="small">
                          Nível: <strong>{point.current_fill_level}%</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 d-flex gap-1 flex-wrap">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOnMap(point);
                        }}
                        title="Ver no mapa"
                      >
                        <i className="fas fa-map-marked-alt"></i>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHistory(point);
                        }}
                        title="Ver histórico e fotos"
                      >
                        <i className="fas fa-history"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPoint(point);
                        }}
                        title="Editar"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsCollected(point);
                        }}
                        disabled={point.status !== "active"}
                        title="Registrar coleta"
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                      <Button
                        variant={
                          point.status === "active"
                            ? "outline-danger"
                            : "outline-warning"
                        }
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(point);
                        }}
                        title={
                          point.status === "active" ? "Desativar" : "Ativar"
                        }
                      >
                        <i
                          className={`fas fa-${
                            point.status === "active" ? "pause" : "play"
                          }`}
                        ></i>
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
      </div>

      {/* Toggle button quando sidebar está fechada */}
      {!sidebarOpen && (
        <Button
          variant="primary"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="fas fa-chevron-right"></i>
        </Button>
      )}

      {/* Mapa em tela cheia */}
      <div className="map-fullscreen">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <MapComponent
              center={[-23.5505, -46.6333]}
              zoom={12}
              points={filteredPoints.filter(
                (point) =>
                  point.latitude &&
                  point.longitude &&
                  !isNaN(point.latitude) &&
                  !isNaN(point.longitude)
              )}
              onPointClick={setSelectedPoint}
              onMapClick={handleMapClickForNewPoint}
              centerOnPoint={centerOnPoint}
              selectedLocation={selectedLocationForNewPoint}
              isSelectionMode={isSelectingLocation}
              style={{ height: "100%", width: "100%" }}
            />

            {/* Overlay de instrução quando está selecionando localização */}
            {isSelectingLocation && (
              <div className="location-selection-overlay">
                <div className="location-selection-card">
                  <h5 className="mb-3">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Selecione a Localização do Ponto
                  </h5>
                  <p className="mb-3">
                    <i className="fas fa-mouse-pointer me-2"></i>
                    Clique no mapa para escolher onde o ponto de coleta será
                    localizado
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelLocationSelection}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detalhes do ponto selecionado */}
        {selectedPoint && (
          <div className="point-details-card">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5 className="mb-0">{selectedPoint.name}</h5>
              <Button
                variant="link"
                size="sm"
                className="text-secondary p-0"
                onClick={() => setSelectedPoint(null)}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>

            <div className="mb-2">
              {getTypeBadge(selectedPoint.point_type || selectedPoint.type)}
              {getStatusBadge(selectedPoint.status)}
            </div>

            <div className="mb-2">
              <small className="text-muted">
                <i className="fas fa-map-marker-alt me-1"></i>
                {selectedPoint.address}
              </small>
            </div>

            {selectedPoint.neighborhood && (
              <div className="mb-2">
                <small className="text-muted">
                  <i className="fas fa-building me-1"></i>
                  {selectedPoint.neighborhood}
                </small>
              </div>
            )}

            {selectedPoint.current_fill_level != null && (
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Nível de Preenchimento</small>
                  <small className="fw-bold">
                    {selectedPoint.current_fill_level}%
                  </small>
                </div>
                <div className="progress">
                  <div
                    className={`progress-bar ${
                      selectedPoint.current_fill_level > 80
                        ? "bg-danger"
                        : selectedPoint.current_fill_level > 60
                        ? "bg-warning"
                        : "bg-success"
                    }`}
                    style={{ width: `${selectedPoint.current_fill_level}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="d-grid gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleViewHistory(selectedPoint)}
              >
                <i className="fas fa-history me-2"></i>
                Ver Histórico e Fotos
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleEditPoint(selectedPoint)}
              >
                <i className="fas fa-edit me-2"></i>
                Editar Ponto
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleMarkAsCollected(selectedPoint)}
                disabled={selectedPoint.status !== "active"}
              >
                <i className="fas fa-check me-2"></i>
                Registrar Coleta
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para adicionar/editar ponto */}
      <CollectionPointModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedLocationForNewPoint(null);
          setIsSelectingLocation(false);
        }}
        onSave={handleSavePoint}
        editPoint={editingPoint}
        preselectedLocation={selectedLocationForNewPoint}
        loading={saveLoading}
      />

      {/* Modal de Histórico e Fotos */}
      <PointHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        collectionPoint={historyPoint}
      />
    </div>
  );
};

export default CollectionPoints;
