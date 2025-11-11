import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Spinner,
  Alert,
  Form,
  InputGroup,
  Table,
  Dropdown,
} from "react-bootstrap";
import {
  collectionsAPI,
  routesAPI,
  vehiclesAPI,
  driversAPI,
} from "../services/api";
import CollectionModal from "../components/CollectionModal";
import CollectionDetailModal from "../components/CollectionDetailModal";
import toast from "react-hot-toast";
import "./Collections.css";

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modais
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  // Filtros de busca
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    route: "",
    date: "",
  });

  useEffect(() => {
    fetchCollections();
    fetchRoutes();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collectionsAPI.getCollections();
      setCollections(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar coletas:", err);
      setError("Erro ao carregar coletas. Tente novamente.");
      toast.error("Erro ao carregar coletas");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routesAPI.getRoutes();
      setRoutes(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar rotas:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await vehiclesAPI.getVehicles();
      setVehicles(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar veículos:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await driversAPI.getDrivers();
      setDrivers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar motoristas:", err);
    }
  };

  const handleCreateCollection = () => {
    setSelectedCollection(null);
    setShowCollectionModal(true);
  };

  const handleEditCollection = (collection) => {
    setSelectedCollection(collection);
    setShowCollectionModal(true);
  };

  const handleViewDetails = (collection) => {
    setSelectedCollection(collection);
    setShowDetailModal(true);
  };

  const handleStartCollection = async (collectionId) => {
    try {
      await collectionsAPI.startCollection(collectionId);
      toast.success("Coleta iniciada com sucesso!");
      await fetchCollections();
    } catch (err) {
      console.error("Erro ao iniciar coleta:", err);
      toast.error("Erro ao iniciar coleta");
    }
  };

  const handleCompleteCollection = async (collectionId) => {
    try {
      await collectionsAPI.completeCollection(collectionId);
      toast.success("Coleta finalizada com sucesso!");
      await fetchCollections();
    } catch (err) {
      console.error("Erro ao finalizar coleta:", err);
      toast.error("Erro ao finalizar coleta");
    }
  };

  const handleSaveCollection = async (collectionData) => {
    try {
      if (selectedCollection) {
        await collectionsAPI.updateCollection(
          selectedCollection.id,
          collectionData
        );
        toast.success("Coleta atualizada com sucesso!");
      } else {
        await collectionsAPI.createCollection(collectionData);
        toast.success("Coleta criada com sucesso!");
      }

      await fetchCollections();
      setShowCollectionModal(false);
    } catch (err) {
      console.error("Erro ao salvar coleta:", err);
      toast.error(err.response?.data?.message || "Erro ao salvar coleta");
      throw err;
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    // Encontrar a coleta para verificar o status
    const collection = collections.find((c) => c.id === collectionId);
    const isCompleted = collection?.status === "completed";

    const confirmMessage = isCompleted
      ? "Esta é uma coleta já realizada. Tem certeza que deseja excluí-la? Esta ação não pode ser desfeita."
      : "Tem certeza que deseja excluir esta coleta?";

    if (window.confirm(confirmMessage)) {
      try {
        await collectionsAPI.deleteCollection(collectionId);
        toast.success("Coleta excluída com sucesso!");
        await fetchCollections();
      } catch (err) {
        console.error("Erro ao excluir coleta:", err);
        toast.error("Erro ao excluir coleta");
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      in_progress: "info",
      completed: "success",
      cancelled: "danger",
    };

    const labels = {
      pending: "Pendente",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada",
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
      </Badge>
    );
  };

  // Filtrar coletas com base nos filtros
  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      // Filtro de busca por identificador
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesId = collection.id?.toString().includes(searchLower);
        const matchesRoute = collection.route_name
          ?.toLowerCase()
          .includes(searchLower);
        const matchesVehicle = collection.vehicle_plate
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesId && !matchesRoute && !matchesVehicle) return false;
      }

      // Filtro por status
      if (filters.status && collection.status !== filters.status) {
        return false;
      }

      // Filtro por rota
      if (filters.route && collection.route !== parseInt(filters.route)) {
        return false;
      }

      // Filtro por data
      if (filters.date) {
        const collectionDate = new Date(collection.scheduled_date)
          .toISOString()
          .slice(0, 10);
        if (collectionDate !== filters.date) {
          return false;
        }
      }

      return true;
    });
  }, [collections, filters]);

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando coletas...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fas fa-clipboard-list me-2"></i>
                Gestão de Coletas
              </h2>
              <p className="text-muted">
                Registre e acompanhe as execuções das rotas de coleta
              </p>
            </div>
            <Button variant="primary" onClick={handleCreateCollection}>
              <i className="fas fa-plus me-2"></i>
              Nova Coleta
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtros de busca */}
      <Row className="mb-3">
        <Col md={3} className="mb-2">
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por ID, rota ou veículo"
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
            />
          </InputGroup>
        </Col>
        <Col md={3} className="mb-2">
          <Form.Select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="">Status (todos)</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </Form.Select>
        </Col>
        <Col md={3} className="mb-2">
          <Form.Select
            value={filters.route}
            onChange={(e) =>
              setFilters((p) => ({ ...p, route: e.target.value }))
            }
          >
            <option value="">Rota (todas)</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3} className="mb-2">
          <Form.Control
            type="date"
            value={filters.date}
            onChange={(e) =>
              setFilters((p) => ({ ...p, date: e.target.value }))
            }
          />
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {collections.length === 0 ? (
        <Row>
          <Col>
            <Alert variant="info" className="text-center py-5">
              <i className="fas fa-clipboard-list fa-3x text-muted mb-3 d-block"></i>
              <h5>Nenhuma coleta cadastrada</h5>
              <p className="text-muted">
                Comece criando o primeiro registro de coleta
              </p>
              <Button variant="primary" onClick={handleCreateCollection}>
                <i className="fas fa-plus me-2"></i>
                Criar Primeira Coleta
              </Button>
            </Alert>
          </Col>
        </Row>
      ) : filteredCollections.length === 0 ? (
        <Row>
          <Col>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Nenhuma coleta encontrada com os filtros selecionados.
            </Alert>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Rota</th>
                    <th>Veículo</th>
                    <th>Motorista</th>
                    <th style={{ width: "120px" }}>Data</th>
                    <th style={{ width: "100px" }}>Horário</th>
                    <th style={{ width: "130px" }}>Status</th>
                    <th style={{ width: "100px" }}>Peso (kg)</th>
                    <th style={{ width: "150px" }} className="text-center">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((collection) => (
                    <tr key={collection.id}>
                      <td className="text-center fw-bold">#{collection.id}</td>
                      <td>
                        <i className="fas fa-route me-2 text-muted"></i>
                        {collection.route_name || "N/A"}
                      </td>
                      <td>
                        <i className="fas fa-truck me-2 text-muted"></i>
                        {collection.vehicle_plate || "N/A"}
                      </td>
                      <td>
                        <i className="fas fa-user me-2 text-muted"></i>
                        {collection.driver_name_display ||
                          collection.driver_name ||
                          "N/A"}
                      </td>
                      <td>
                        {collection.scheduled_date
                          ? new Date(
                              collection.scheduled_date
                            ).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </td>
                      <td>{collection.scheduled_time || "N/A"}</td>
                      <td>{getStatusBadge(collection.status)}</td>
                      <td className="text-end">
                        {collection.waste_collected_weight ||
                          collection.total_weight ||
                          0}
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="Ver detalhes"
                            onClick={() => handleViewDetails(collection)}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>

                          {collection.status === "pending" && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                title="Editar"
                                onClick={() => handleEditCollection(collection)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                title="Iniciar coleta"
                                onClick={() =>
                                  handleStartCollection(collection.id)
                                }
                              >
                                <i className="fas fa-play"></i>
                              </Button>
                            </>
                          )}

                          {collection.status === "in_progress" && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              title="Finalizar coleta"
                              onClick={() =>
                                handleCompleteCollection(collection.id)
                              }
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          )}

                          {collection.status === "completed" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Editar"
                              onClick={() => handleEditCollection(collection)}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          )}

                          {(collection.status === "pending" ||
                            collection.status === "cancelled" ||
                            collection.status === "completed") && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Excluir"
                              onClick={() =>
                                handleDeleteCollection(collection.id)
                              }
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Informações adicionais */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted">
                Mostrando {filteredCollections.length} de {collections.length}{" "}
                coleta(s)
              </span>
            </div>
          </Col>
        </Row>
      )}

      {/* Modais */}
      <CollectionModal
        show={showCollectionModal}
        onHide={() => setShowCollectionModal(false)}
        onSave={handleSaveCollection}
        collection={selectedCollection}
        routes={routes}
        vehicles={vehicles}
        drivers={drivers}
      />

      <CollectionDetailModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        collection={selectedCollection}
      />
    </Container>
  );
};

export default Collections;
