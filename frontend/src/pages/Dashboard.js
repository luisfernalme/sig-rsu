import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Container, Badge, ListGroup } from 'react-bootstrap';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import { reportsAPI } from '../services/api';
import { format, parseISO } from 'date-fns';

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
  const [stats, setStats] = useState({
    totalRoutes: 0,
    activeRoutes: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalCollectionPoints: 0,
    fullCollectionPoints: 0,
    collectionsToday: 0,
    executionsToday: 0,
    wasteCollectedToday: 0,
    collectionsWeek: 0,
    wasteCollectedWeek: 0,
    distanceTraveledWeek: 0,
    vehiclesMaintenanceDue: 0,
    pointsNeedCollection: 0,
    overdueExecutions: 0,
  });
  const [collectionsChartData, setCollectionsChartData] = useState(null);
  const [wasteTypesData, setWasteTypesData] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [dashboardData, collectionsReport, efficiencyReport] = await Promise.all([
          reportsAPI.getDashboardStats(),
          reportsAPI.getCollectionReport(),
          reportsAPI.getEfficiencyReport(),
        ]);

        // Mapear estatísticas para os campos do dashboard
        setStats({
          totalRoutes: dashboardData.total_routes || 0,
          activeRoutes: dashboardData.active_routes || 0,
          totalVehicles: dashboardData.total_vehicles || 0,
          activeVehicles: dashboardData.active_vehicles || 0,
          totalCollectionPoints: dashboardData.total_collection_points || 0,
          fullCollectionPoints: dashboardData.full_collection_points || 0,
          collectionsToday: dashboardData.collections_today || 0,
          executionsToday: dashboardData.executions_today || 0,
          wasteCollectedToday: dashboardData.waste_collected_today || 0,
          collectionsWeek: dashboardData.collections_week || 0,
          wasteCollectedWeek: dashboardData.waste_collected_week || 0,
          distanceTraveledWeek: dashboardData.distance_traveled_week || 0,
          vehiclesMaintenanceDue: dashboardData.vehicles_maintenance_due || 0,
          pointsNeedCollection: dashboardData.points_need_collection || 0,
          overdueExecutions: dashboardData.overdue_executions || 0,
        });

        // Gráfico de coletas diárias (últimos 30 dias do endpoint)
        const daily = (collectionsReport?.daily_collections || []).slice(-30);
        const lineData = {
          labels: daily.map((d) => {
            try {
              return format(parseISO(d.date), 'dd/MM');
            } catch {
              return d.date;
            }
          }),
          datasets: [
            {
              label: 'Coletas por dia',
              data: daily.map((d) => d.count || 0),
              fill: false,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.15,
            },
          ],
        };
        setCollectionsChartData(lineData);

        // Gráfico de tipos de coleta (por tipo de ponto)
        const typesObj = collectionsReport?.collections_by_type || {};
        const doughnutData = {
          labels: Object.keys(typesObj),
          datasets: [
            {
              data: Object.values(typesObj),
              backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6610f2', '#20c997'],
            },
          ],
        };
        setWasteTypesData(doughnutData);

        // Eficiência por rota (taxa de conclusão)
        const effByRoute = (efficiencyReport?.efficiency_by_route || [])
          .sort((a, b) => (b.total_executions || 0) - (a.total_executions || 0))
          .slice(0, 8);
        const barData = {
          labels: effByRoute.map((r) => r.route_name || `Rota ${r.route_id}`),
          datasets: [
            {
              label: 'Taxa de conclusão (%)',
              data: effByRoute.map((r) => Math.round((r.completion_rate || 0) * 10) / 10),
              backgroundColor: 'rgba(54, 162, 235, 0.4)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        };
        setEfficiencyData(barData);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
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
          <p className="text-muted">Visão geral do sistema de coleta de resíduos</p>
        </Col>
      </Row>

      {/* Cards de estatísticas principais */}
      <Row className="mb-4">
        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100 border-start border-primary border-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-primary">Total de Rotas</h6>
                  <h3 className="mb-0">{stats.totalRoutes}</h3>
                  <small className="text-muted">Ativas: {stats.activeRoutes}</small>
                </div>
                <div className="text-primary">
                  <i className="fas fa-route fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100 border-start border-success border-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-success">Veículos Ativos</h6>
                  <h3 className="mb-0">{stats.activeVehicles}</h3>
                  <small className="text-muted">Total: {stats.totalVehicles}</small>
                </div>
                <div className="text-success">
                  <i className="fas fa-truck fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100 border-start border-warning border-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-warning">Pontos de Coleta</h6>
                  <h3 className="mb-0">{stats.totalCollectionPoints}</h3>
                  <small className="text-muted">Cheios: {stats.fullCollectionPoints}</small>
                </div>
                <div className="text-warning">
                  <i className="fas fa-map-marker-alt fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3} className="mb-3">
          <Card className="dashboard-card h-100 border-start border-info border-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-info">Coletas Hoje</h6>
                  <h3 className="mb-0">{stats.collectionsToday}</h3>
                  <small className="text-muted">Execuções: {stats.executionsToday}</small>
                </div>
                <div className="text-info">
                  <i className="fas fa-trash fa-2x"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row className="mb-4">
        <Col xs={12} lg={8} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Coletas diárias (últimos 30 dias)
              </h5>
            </Card.Header>
            <Card.Body>
              {collectionsChartData ? (
                <Line data={collectionsChartData} options={{ responsive: true }} />
              ) : (
                <div className="text-muted">Sem dados suficientes para exibir.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Coletas por tipo de ponto
              </h5>
            </Card.Header>
            <Card.Body>
              {wasteTypesData ? (
                <Doughnut data={wasteTypesData} options={{ responsive: true }} />
              ) : (
                <div className="text-muted">Sem dados suficientes para exibir.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xs={12} lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Eficiência por rota (taxa de conclusão)
              </h5>
            </Card.Header>
            <Card.Body>
              {efficiencyData ? (
                <Bar data={efficiencyData} options={{ responsive: true, scales: { y: { min: 0, max: 100 } } }} />
              ) : (
                <div className="text-muted">Sem dados suficientes para exibir.</div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Destaques da semana
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col xs={4} className="mb-3">
                  <h4 className="text-success">{Number(stats.wasteCollectedWeek).toFixed(1)} kg</h4>
                  <small className="text-muted">Resíduos coletados</small>
                </Col>
                <Col xs={4} className="mb-3">
                  <h4 className="text-primary">{stats.collectionsWeek}</h4>
                  <small className="text-muted">Coletas realizadas</small>
                </Col>
                <Col xs={4} className="mb-3">
                  <h4 className="text-info">{Number(stats.distanceTraveledWeek).toFixed(1)} km</h4>
                  <small className="text-muted">Distância percorrida</small>
                </Col>
              </Row>
              <hr />
              <h6 className="mb-3"><i className="fas fa-bell me-2 text-warning"></i>Alertas</h6>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                  Veículos com manutenção pendente
                  <Badge bg="warning" text="dark">{stats.vehiclesMaintenanceDue}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                  Pontos que precisam de coleta
                  <Badge bg="danger">{stats.pointsNeedCollection}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                  Execuções atrasadas
                  <Badge bg="secondary">{stats.overdueExecutions}</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;