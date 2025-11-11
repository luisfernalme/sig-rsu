import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Container,
  Badge,
  ListGroup,
  Spinner,
  Table,
} from "react-bootstrap";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import {
  routesAPI,
  vehiclesAPI,
  driversAPI,
  collectionPointsAPI,
  collectionsAPI,
} from "../services/api";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  isToday,
  isThisWeek,
  subDays,
} from "date-fns";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalCollectionPoints: 0,
    collectionsToday: 0,
    collectionsCompleted: 0,
    collectionsInProgress: 0,
    collectionsPending: 0,
    collectionsWeek: 0,
    wasteCollectedWeek: 0,
  });
  const [collectionsChartData, setCollectionsChartData] = useState(null);
  const [statusChartData, setStatusChartData] = useState(null);
  const [routeChartData, setRouteChartData] = useState(null);
  const [recentCollections, setRecentCollections] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Buscar dados de todas as APIs
      const [
        routesData,
        vehiclesData,
        driversData,
        pointsData,
        collectionsData,
      ] = await Promise.all([
        routesAPI.getRoutes(),
        vehiclesAPI.getVehicles(),
        driversAPI.getDrivers(),
        collectionPointsAPI.getCollectionPoints(),
        collectionsAPI.getCollections(),
      ]);

      // Extrair arrays
      const routesList = Array.isArray(routesData)
        ? routesData
        : routesData.results || [];
      const vehiclesList = Array.isArray(vehiclesData)
        ? vehiclesData
        : vehiclesData.results || [];
      const driversList = Array.isArray(driversData)
        ? driversData
        : driversData.results || [];
      const pointsList = Array.isArray(pointsData)
        ? pointsData
        : pointsData.results || [];
      const collectionsList = Array.isArray(collectionsData)
        ? collectionsData
        : collectionsData.results || [];

      setRoutes(routesList);
      setVehicles(vehiclesList);
      setDrivers(driversList);
      setCollectionPoints(pointsList);
      setCollections(collectionsList);

      // Calcular estatísticas
      calculateStats(
        routesList,
        vehiclesList,
        driversList,
        pointsList,
        collectionsList
      );

      // Preparar dados dos gráficos
      prepareChartData(collectionsList);

      // Coletas recentes (últimas 5)
      const recent = [...collectionsList]
        .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
        .slice(0, 5);
      setRecentCollections(recent);

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      setLoading(false);
    }
  };

  const calculateStats = (
    routesList,
    vehiclesList,
    driversList,
    pointsList,
    collectionsList
  ) => {
    // Rotas
    const totalRoutes = routesList.length;
    const activeRoutes = routesList.filter((r) => r.status === "active").length;

    // Veículos
    const totalVehicles = vehiclesList.length;
    const activeVehicles = vehiclesList.filter(
      (v) => v.status === "active"
    ).length;

    // Motoristas
    const totalDrivers = driversList.length;
    const activeDrivers = driversList.filter(
      (d) => d.status === "active"
    ).length;

    // Pontos de coleta
    const totalCollectionPoints = pointsList.length;

    // Coletas por status
    const collectionsCompleted = collectionsList.filter(
      (c) => c.status === "completed"
    ).length;
    const collectionsInProgress = collectionsList.filter(
      (c) => c.status === "in_progress"
    ).length;
    const collectionsPending = collectionsList.filter(
      (c) => c.status === "pending"
    ).length;

    // Coletas de hoje
    const collectionsToday = collectionsList.filter((c) => {
      try {
        return isToday(parseISO(c.scheduled_date));
      } catch {
        return false;
      }
    }).length;

    // Coletas desta semana
    const collectionsWeek = collectionsList.filter((c) => {
      try {
        return isThisWeek(parseISO(c.scheduled_date), { weekStartsOn: 0 });
      } catch {
        return false;
      }
    }).length;

    // Peso total coletado esta semana
    const wasteCollectedWeek = collectionsList
      .filter((c) => {
        try {
          return (
            c.status === "completed" &&
            isThisWeek(parseISO(c.scheduled_date), { weekStartsOn: 0 })
          );
        } catch {
          return false;
        }
      })
      .reduce((sum, c) => sum + (parseFloat(c.waste_collected_weight) || 0), 0);

    setStats({
      totalRoutes,
      activeRoutes,
      totalVehicles,
      activeVehicles,
      totalDrivers,
      activeDrivers,
      totalCollectionPoints,
      collectionsToday,
      collectionsCompleted,
      collectionsInProgress,
      collectionsPending,
      collectionsWeek,
      wasteCollectedWeek,
    });
  };

  const prepareChartData = (collectionsList) => {
    // Gráfico de coletas dos últimos 30 dias
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const count = collectionsList.filter((c) => {
        try {
          return format(parseISO(c.scheduled_date), "yyyy-MM-dd") === dateStr;
        } catch {
          return false;
        }
      }).length;

      last30Days.push({
        date: format(date, "dd/MM"),
        count,
      });
    }

    setCollectionsChartData({
      labels: last30Days.map((d) => d.date),
      datasets: [
        {
          label: "Coletas por dia",
          data: last30Days.map((d) => d.count),
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
        },
      ],
    });

    // Gráfico de status das coletas
    const statusCounts = {
      Pendente: collectionsList.filter((c) => c.status === "pending").length,
      "Em Andamento": collectionsList.filter((c) => c.status === "in_progress")
        .length,
      Concluída: collectionsList.filter((c) => c.status === "completed").length,
      Cancelada: collectionsList.filter((c) => c.status === "cancelled").length,
    };

    setStatusChartData({
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: ["#ffc107", "#0dcaf0", "#198754", "#dc3545"],
          borderWidth: 1,
        },
      ],
    });

    // Gráfico de coletas por rota (top 10)
    const routeCounts = {};
    collectionsList.forEach((c) => {
      const routeName = c.route_name || "Sem rota";
      routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
    });

    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    setRouteChartData({
      labels: topRoutes.map(([name]) => name),
      datasets: [
        {
          label: "Número de coletas",
          data: topRoutes.map(([, count]) => count),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: "warning", text: "Pendente" },
      in_progress: { bg: "info", text: "Em Andamento" },
      completed: { bg: "success", text: "Concluída" },
      cancelled: { bg: "danger", text: "Cancelada" },
    };
    const { bg, text } = config[status] || { bg: "secondary", text: status };
    return <Badge bg={bg}>{text}</Badge>;
  };

  if (loading) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="text-center">
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-3 text-muted">Carregando dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard
          </h2>
          <p className="text-muted">
            Visão geral do sistema de coleta de resíduos sólidos urbanos
          </p>
        </Col>
      </Row>

      {/* Cards de estatísticas principais */}
      <Row className="mb-4">
        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 border-start border-primary border-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted mb-1">Rotas</h6>
                  <h3 className="mb-0 text-primary">{stats.totalRoutes}</h3>
                  <small className="text-muted">
                    <i className="fas fa-check-circle text-success me-1"></i>
                    {stats.activeRoutes} ativas
                  </small>
                </div>
                <div className="text-primary opacity-50">
                  <i className="fas fa-route fa-3x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 border-start border-success border-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted mb-1">Veículos</h6>
                  <h3 className="mb-0 text-success">{stats.totalVehicles}</h3>
                  <small className="text-muted">
                    <i className="fas fa-check-circle text-success me-1"></i>
                    {stats.activeVehicles} ativos
                  </small>
                </div>
                <div className="text-success opacity-50">
                  <i className="fas fa-truck fa-3x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 border-start border-info border-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted mb-1">Motoristas</h6>
                  <h3 className="mb-0 text-info">{stats.totalDrivers}</h3>
                  <small className="text-muted">
                    <i className="fas fa-check-circle text-success me-1"></i>
                    {stats.activeDrivers} ativos
                  </small>
                </div>
                <div className="text-info opacity-50">
                  <i className="fas fa-user-tie fa-3x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 border-start border-warning border-4 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-muted mb-1">
                    Pontos de Coleta
                  </h6>
                  <h3 className="mb-0 text-warning">
                    {stats.totalCollectionPoints}
                  </h3>
                  <small className="text-muted">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Total cadastrados
                  </small>
                </div>
                <div className="text-warning opacity-50">
                  <i className="fas fa-map-marked-alt fa-3x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cards de coletas */}
      <Row className="mb-4">
        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-day fa-2x text-primary mb-2"></i>
              <h3 className="mb-1">{stats.collectionsToday}</h3>
              <small className="text-muted">Coletas Hoje</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <i className="fas fa-calendar-week fa-2x text-info mb-2"></i>
              <h3 className="mb-1">{stats.collectionsWeek}</h3>
              <small className="text-muted">Coletas Esta Semana</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <i className="fas fa-check-circle fa-2x text-success mb-2"></i>
              <h3 className="mb-1">{stats.collectionsCompleted}</h3>
              <small className="text-muted">Coletas Concluídas</small>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <i className="fas fa-weight fa-2x text-success mb-2"></i>
              <h3 className="mb-1">{stats.wasteCollectedWeek.toFixed(1)}</h3>
              <small className="text-muted">kg Coletados (Semana)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos principais */}
      <Row className="mb-4">
        <Col xs={12} lg={8} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2 text-primary"></i>
                Coletas nos últimos 30 dias
              </h5>
            </Card.Header>
            <Card.Body>
              {collectionsChartData ? (
                <Line
                  data={collectionsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-chart-line fa-3x mb-3 opacity-50"></i>
                  <p>Sem dados suficientes</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2 text-primary"></i>
                Status das Coletas
              </h5>
            </Card.Header>
            <Card.Body>
              {statusChartData ? (
                <Doughnut
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-chart-pie fa-3x mb-3 opacity-50"></i>
                  <p>Sem dados suficientes</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico de rotas e coletas recentes */}
      <Row className="mb-4">
        <Col xs={12} lg={7} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2 text-primary"></i>
                Top 10 Rotas Mais Utilizadas
              </h5>
            </Card.Header>
            <Card.Body>
              {routeChartData ? (
                <Bar
                  data={routeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: "y",
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-chart-bar fa-3x mb-3 opacity-50"></i>
                  <p>Sem dados suficientes</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="fas fa-list me-2 text-primary"></i>
                Coletas Recentes
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              {recentCollections.length > 0 ? (
                <ListGroup variant="flush">
                  {recentCollections.map((collection) => (
                    <ListGroup.Item key={collection.id} className="px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {collection.route_name || "Rota não definida"}
                          </div>
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            {collection.scheduled_date
                              ? format(
                                  parseISO(collection.scheduled_date),
                                  "dd/MM/yyyy"
                                )
                              : "Data não definida"}
                          </small>
                          <br />
                          <small className="text-muted">
                            <i className="fas fa-truck me-1"></i>
                            {collection.vehicle_plate || "Veículo não definido"}
                          </small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(collection.status)}
                          {collection.waste_collected_weight > 0 && (
                            <>
                              <br />
                              <small className="text-success">
                                <i className="fas fa-weight me-1"></i>
                                {collection.waste_collected_weight} kg
                              </small>
                            </>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-clipboard-list fa-3x mb-3 opacity-50"></i>
                  <p>Nenhuma coleta registrada</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
