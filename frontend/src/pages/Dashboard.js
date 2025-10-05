import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Container } from 'react-bootstrap';
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
    activeVehicles: 0,
    collectionPoints: 0,
    todayCollections: 0,
    weeklyWaste: 0,
    monthlyWaste: 0,
    efficiency: 0,
    costs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const dashboardData = await reportsAPI.getDashboardStats();
        
        setStats({
          totalRoutes: dashboardData.total_routes || 0,
          activeVehicles: dashboardData.active_vehicles || 0,
          collectionPoints: dashboardData.total_points || 0,
          todayCollections: dashboardData.today_collections || 0,
          weeklyWaste: dashboardData.weekly_waste || 0,
          monthlyWaste: dashboardData.monthly_waste || 0,
          efficiency: dashboardData.efficiency || 0,
          costs: dashboardData.monthly_costs || 0,
        });
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Fallback para dados simulados em caso de erro
        setStats({
          totalRoutes: 3,
          activeVehicles: 4,
          collectionPoints: 8,
          todayCollections: 15,
          weeklyWaste: 2.5,
          monthlyWaste: 10.2,
          efficiency: 87,
          costs: 15420,
        });
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Dados para o gráfico de coletas diárias
  const collectionsChartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Coletas Realizadas',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // Dados para o gráfico de tipos de resíduos
  const wasteTypesData = {
    labels: ['Orgânico', 'Reciclável', 'Rejeito', 'Perigoso'],
    datasets: [
      {
        data: [45, 30, 20, 5],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#FF9F40',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#FF9F40',
        ],
      },
    ],
  };

  // Dados para o gráfico de eficiência por rota
  const efficiencyData = {
    labels: ['Rota A', 'Rota B', 'Rota C', 'Rota D', 'Rota E'],
    datasets: [
      {
        label: 'Eficiência (%)',
        data: [85, 92, 78, 88, 95],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

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
                  <h3 className="mb-0">{stats.collectionPoints}</h3>
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
                  <h3 className="mb-0">{stats.todayCollections}</h3>
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
                Coletas por Dia da Semana
              </h5>
            </Card.Header>
            <Card.Body>
              <Line data={collectionsChartData} options={{ responsive: true }} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={4} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Tipos de Resíduos
              </h5>
            </Card.Header>
            <Card.Body>
              <Doughnut data={wasteTypesData} options={{ responsive: true }} />
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
                Eficiência por Rota
              </h5>
            </Card.Header>
            <Card.Body>
              <Bar data={efficiencyData} options={{ responsive: true }} />
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Resumo Mensal
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} className="text-center">
                  <h4 className="text-success">{stats.weeklyWaste}t</h4>
                  <small className="text-muted">Resíduos Coletados (Semana)</small>
                </Col>
                <Col xs={6} className="text-center">
                  <h4 className="text-primary">{stats.monthlyWaste}t</h4>
                  <small className="text-muted">Resíduos Coletados (Mês)</small>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col xs={6} className="text-center">
                  <h4 className="text-info">{stats.efficiency}%</h4>
                  <small className="text-muted">Eficiência Geral</small>
                </Col>
                <Col xs={6} className="text-center">
                  <h4 className="text-warning">R$ {stats.costs.toLocaleString()}</h4>
                  <small className="text-muted">Custos Mensais</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;