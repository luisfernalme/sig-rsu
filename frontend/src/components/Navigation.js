import React from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useAuth } from "../services/authContext";

const Navigation = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
      <Container fluid>
        <Navbar.Brand>
          <i className="fas fa-recycle me-2"></i>
          Sistema de Coleta de Resíduos
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/dashboard">
              <Nav.Link>
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/routes">
              <Nav.Link>
                <i className="fas fa-route me-1"></i>
                Rotas
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/vehicles">
              <Nav.Link>
                <i className="fas fa-truck me-1"></i>
                Veículos
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/collection-points">
              <Nav.Link>
                <i className="fas fa-map-marker-alt me-1"></i>
                Pontos de Coleta
              </Nav.Link>
            </LinkContainer>

            <LinkContainer to="/reports">
              <Nav.Link>
                <i className="fas fa-chart-bar me-1"></i>
                Relatórios
              </Nav.Link>
            </LinkContainer>
          </Nav>

          <Nav>
            <NavDropdown
              title={
                <>
                  <i className="fas fa-user me-1"></i>
                  {user?.first_name || user?.username}
                </>
              }
              id="user-dropdown"
            >
              <LinkContainer to="/profile">
                <NavDropdown.Item>
                  <i className="fas fa-user-circle me-2"></i>
                  Meu Perfil
                </NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2"></i>
                Sair
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
