import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Form,
  InputGroup,
} from "react-bootstrap";
import { routesAPI, collectionPointsAPI } from "../services/api";
import RouteModal from "../components/RouteModal";
import RouteMapView from "../components/RouteMapView";
import toast from "react-hot-toast";
import "./Routes.css";

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modais
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Filtros de busca
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    frequency: "",
  });

  useEffect(() => {
    fetchRoutes();
    fetchCollectionPoints();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesAPI.getRoutes();
      setRoutes(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar rotas:", err);
      setError("Erro ao carregar rotas. Tente novamente.");
      toast.error("Erro ao carregar rotas");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionPoints = async () => {
    try {
      const data = await collectionPointsAPI.getCollectionPoints();
      setCollectionPoints(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Erro ao buscar pontos de coleta:", err);
    }
  };

  const handleCreateRoute = () => {
    setSelectedRoute(null);
    setShowRouteModal(true);
  };

  const handleEditRoute = (route) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const handleViewMap = async (route) => {
    try {
      // Buscar dados detalhados da rota incluindo pontos de coleta
      const detailedRoute = await routesAPI.getRoute(route.id);
      setSelectedRoute(detailedRoute);
      setShowMapModal(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes da rota:", err);
      toast.error("Erro ao carregar detalhes da rota");
      // Se falhar, mostrar com dados básicos
      setSelectedRoute(route);
      setShowMapModal(true);
    }
  };

  const handleSaveRoute = async (routeData) => {
    try {
      if (selectedRoute) {
        // Atualizar rota existente
        await routesAPI.updateRoute(selectedRoute.id, routeData);
        toast.success("Rota atualizada com sucesso!");
      } else {
        // Criar nova rota
        await routesAPI.createRoute(routeData);
        toast.success("Rota criada com sucesso!");
      }

      // Recarregar lista de rotas
      await fetchRoutes();
      setShowRouteModal(false);
    } catch (err) {
      console.error("Erro ao salvar rota:", err);
      toast.error(err.response?.data?.message || "Erro ao salvar rota");
      throw err; // Para que o modal possa tratar o erro
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Tem certeza que deseja excluir esta rota?")) {
      try {
        await routesAPI.deleteRoute(routeId);
        toast.success("Rota excluída com sucesso!");
        await fetchRoutes();
      } catch (err) {
        console.error("Erro ao excluir rota:", err);
        toast.error("Erro ao excluir rota");
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      maintenance: "warning",
    };

    const labels = {
      active: "Ativa",
      inactive: "Inativa",
      maintenance: "Manutenção",
    };

    return (
      <Badge bg={variants[status]} className="status-badge">
        {labels[status]}
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

  // Filtrar rotas com base nos filtros
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      // Filtro de busca por nome ou descrição
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = route.name?.toLowerCase().includes(searchLower);
        const matchesDescription = route.description
          ?.toLowerCase()
          .includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }

      // Filtro por status
      if (filters.status && route.status !== filters.status) {
        return false;
      }

      // Filtro por frequência
      if (filters.frequency && route.frequency !== filters.frequency) {
        return false;
      }

      return true;
    });
  }, [routes, filters]);

  if (loading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando rotas...</p>
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
                <i className="fas fa-route me-2"></i>
                Gestão de Rotas
              </h2>
              <p className="text-muted">
                Gerencie as rotas de coleta de resíduos
              </p>
            </div>
            <Button variant="primary" onClick={handleCreateRoute}>
              <i className="fas fa-plus me-2"></i>
              Nova Rota
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtros de busca */}
      <Row className="mb-3">
        <Col md={4} className="mb-2">
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nome ou descrição"
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
            />
          </InputGroup>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="">Status (todos)</option>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
            <option value="maintenance">Manutenção</option>
          </Form.Select>
        </Col>
        <Col md={4} className="mb-2">
          <Form.Select
            value={filters.frequency}
            onChange={(e) =>
              setFilters((p) => ({ ...p, frequency: e.target.value }))
            }
          >
            <option value="">Frequência (todas)</option>
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quinzenal</option>
            <option value="monthly">Mensal</option>
          </Form.Select>
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

      {routes.length === 0 ? (
        <Row>
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <i className="fas fa-route fa-3x text-muted mb-3"></i>
                <h5>Nenhuma rota cadastrada</h5>
                <p className="text-muted">
                  Comece criando sua primeira rota de coleta
                </p>
                <Button variant="primary" onClick={handleCreateRoute}>
                  <i className="fas fa-plus me-2"></i>
                  Criar Primeira Rota
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : filteredRoutes.length === 0 ? (
        <Row>
          <Col>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Nenhuma rota encontrada com os filtros selecionados.
            </Alert>
          </Col>
        </Row>
      ) : (
        <Row>
          {filteredRoutes.map((route) => (
            <Col xs={12} lg={6} xl={4} key={route.id} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{route.name}</h5>
                  {getStatusBadge(route.status)}
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    {route.description || "Sem descrição"}
                  </p>

                  <Row className="mb-3">
                    <Col xs={6}>
                      <small className="text-muted">Frequência</small>
                      <div className="fw-bold">
                        {getFrequencyLabel(route.frequency)}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Pontos</small>
                      <div className="fw-bold">
                        {route.collection_points_count || 0}
                      </div>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col xs={6}>
                      <small className="text-muted">Duração</small>
                      <div className="fw-bold">
                        {route.estimated_duration || "N/A"}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted">Distância</small>
                      <div className="fw-bold">
                        {route.estimated_distance || 0} km
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className="d-flex gap-2 flex-wrap">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="flex-fill"
                    onClick={() => handleEditRoute(route)}
                  >
                    <i className="fas fa-edit me-1"></i>
                    Editar
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="flex-fill"
                    onClick={() => handleViewMap(route)}
                  >
                    <i className="fas fa-map me-1"></i>
                    Ver Mapa
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modais */}
      <RouteModal
        show={showRouteModal}
        onHide={() => setShowRouteModal(false)}
        onSave={handleSaveRoute}
        route={selectedRoute}
        collectionPoints={collectionPoints}
      />

      <RouteMapView
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        route={selectedRoute}
        collectionPoints={selectedRoute?.collection_points || []}
      />
    </Container>
  );
};

export default Routes;
