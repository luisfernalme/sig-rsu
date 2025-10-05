import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Tab, Tabs, Form, Table, Modal } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [reportType, setReportType] = useState('');

  // Dados simulados para relatórios
  const collectionStats = {
    today: { collected: 15, pending: 3, total: 18 },
    week: { collected: 89, pending: 12, total: 101 },
    month: { collected: 356, pending: 23, total: 379 },
  };

  const weeklyData = {
    labels: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
    datasets: [
      {
        label: 'Pontos Coletados',
        data: [12, 15, 18, 14, 16, 10, 8],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const wasteTypeData = {
    labels: ['Orgânico', 'Reciclável', 'Rejeito', 'Especial'],
    datasets: [
      {
        data: [45, 30, 20, 5],
        backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#dc3545'],
        borderWidth: 1,
      },
    ],
  };

  const recentCollections = [
    {
      id: 1,
      date: '2024-10-20',
      time: '08:30',
      point: 'Ponto Centro - Praça Central',
      vehicle: 'ABC-1234',
      driver: 'João Silva',
      weight: 120,
      status: 'completed',
    },
    {
      id: 2,
      date: '2024-10-20',
      time: '09:15',
      point: 'Ponto Comercial - Av. Principal',
      vehicle: 'DEF-5678',
      driver: 'Maria Santos',
      weight: 180,
      status: 'completed',
    },
    {
      id: 3,
      date: '2024-10-20',
      time: '10:00',
      point: 'Ponto Residencial - Bairro Norte',
      vehicle: 'ABC-1234',
      driver: 'João Silva',
      weight: 95,
      status: 'in_progress',
    },
  ];

  const vehiclePerformance = [
    { vehicle: 'ABC-1234', driver: 'João Silva', pointsCollected: 45, totalWeight: 3200, fuelEfficiency: 8.5 },
    { vehicle: 'DEF-5678', driver: 'Maria Santos', pointsCollected: 38, totalWeight: 2850, fuelEfficiency: 7.2 },
    { vehicle: 'GHI-9012', driver: 'Carlos Lima', pointsCollected: 42, totalWeight: 3100, fuelEfficiency: 8.1 },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const handleExportReport = () => {
    // Implementar lógica de exportação
    console.log('Exportando relatório:', reportType);
    setShowExportModal(false);
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="fas fa-chart-bar me-2"></i>
                Relatórios e Análises
              </h2>
              <p className="text-muted">Visualize dados e estatísticas do sistema</p>
            </div>
            <Button variant="primary" onClick={() => setShowExportModal(true)}>
              <i className="fas fa-download me-2"></i>
              Exportar Relatório
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="dashboard" title={<><i className="fas fa-tachometer-alt me-2"></i>Dashboard</>}>
          {/* Cards de estatísticas */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="bg-primary text-white">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{collectionStats.today.collected}</h4>
                      <p className="mb-0">Coletas Hoje</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-check-circle fa-2x"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="bg-success text-white">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{collectionStats.week.collected}</h4>
                      <p className="mb-0">Coletas Semana</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-calendar-week fa-2x"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="bg-info text-white">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4>{collectionStats.month.collected}</h4>
                      <p className="mb-0">Coletas Mês</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-calendar-alt fa-2x"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Gráficos */}
          <Row className="mb-4">
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Coletas por Dia da Semana</h5>
                </Card.Header>
                <Card.Body>
                  <Bar data={weeklyData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Tipos de Resíduos</h5>
                </Card.Header>
                <Card.Body>
                  <Doughnut data={wasteTypeData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Coletas recentes */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Coletas Recentes</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Data/Hora</th>
                          <th>Ponto</th>
                          <th>Veículo</th>
                          <th>Motorista</th>
                          <th>Peso (kg)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentCollections.map((collection) => (
                          <tr key={collection.id}>
                            <td>
                              <div>{new Date(collection.date).toLocaleDateString('pt-BR')}</div>
                              <small className="text-muted">{collection.time}</small>
                            </td>
                            <td>{collection.point}</td>
                            <td>{collection.vehicle}</td>
                            <td>{collection.driver}</td>
                            <td>{collection.weight}</td>
                            <td>
                              <span className={`badge ${collection.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                {collection.status === 'completed' ? 'Concluído' : 'Em Andamento'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="performance" title={<><i className="fas fa-chart-line me-2"></i>Performance</>}>
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Performance dos Veículos</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Veículo</th>
                          <th>Motorista</th>
                          <th>Pontos Coletados</th>
                          <th>Peso Total (kg)</th>
                          <th>Eficiência Combustível (km/l)</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehiclePerformance.map((vehicle, index) => (
                          <tr key={index}>
                            <td><strong>{vehicle.vehicle}</strong></td>
                            <td>{vehicle.driver}</td>
                            <td>{vehicle.pointsCollected}</td>
                            <td>{vehicle.totalWeight.toLocaleString()}</td>
                            <td>{vehicle.fuelEfficiency}</td>
                            <td>
                              <Button variant="outline-primary" size="sm">
                                <i className="fas fa-eye me-1"></i>
                                Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="analytics" title={<><i className="fas fa-analytics me-2"></i>Análises</>}>
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Eficiência por Bairro</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Centro</span>
                      <span>95%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-success" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Bairro Norte</span>
                      <span>87%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-info" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Bairro Sul</span>
                      <span>92%</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar bg-primary" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Indicadores Mensais</h5>
                </Card.Header>
                <Card.Body>
                  <div className="row text-center">
                    <div className="col-6 mb-3">
                      <h3 className="text-primary">98.5%</h3>
                      <small className="text-muted">Taxa de Coleta</small>
                    </div>
                    <div className="col-6 mb-3">
                      <h3 className="text-success">2.3t</h3>
                      <small className="text-muted">Resíduos Coletados</small>
                    </div>
                    <div className="col-6 mb-3">
                      <h3 className="text-info">156</h3>
                      <small className="text-muted">Pontos Atendidos</small>
                    </div>
                    <div className="col-6 mb-3">
                      <h3 className="text-warning">8.2</h3>
                      <small className="text-muted">Eficiência Média</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="custom" title={<><i className="fas fa-cog me-2"></i>Personalizado</>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Gerador de Relatórios Personalizado</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Período</Form.Label>
                      <Form.Select>
                        <option>Última semana</option>
                        <option>Último mês</option>
                        <option>Últimos 3 meses</option>
                        <option>Personalizado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Relatório</Form.Label>
                      <Form.Select>
                        <option>Coletas por região</option>
                        <option>Performance de veículos</option>
                        <option>Eficiência de rotas</option>
                        <option>Análise de resíduos</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Filtrar por Bairro</Form.Label>
                      <Form.Select>
                        <option>Todos os bairros</option>
                        <option>Centro</option>
                        <option>Bairro Norte</option>
                        <option>Bairro Sul</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Formato de Exportação</Form.Label>
                      <Form.Select>
                        <option>PDF</option>
                        <option>Excel</option>
                        <option>CSV</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="primary">
                  <i className="fas fa-chart-bar me-2"></i>
                  Gerar Relatório
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal de exportação */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Exportar Relatório</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Relatório</Form.Label>
              <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="">Selecione o tipo</option>
                <option value="dashboard">Dashboard Geral</option>
                <option value="performance">Performance de Veículos</option>
                <option value="analytics">Análises Detalhadas</option>
                <option value="custom">Relatório Personalizado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Formato</Form.Label>
              <Form.Select>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExportReport}>
            <i className="fas fa-download me-2"></i>
            Exportar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Reports;