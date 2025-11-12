import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../services/authContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center bg-white"
    >
      <Row className="w-100">
        <Col xs={12} sm={10} md={8} lg={5} xl={4} className="mx-auto">
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div
                  className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="fas fa-recycle fa-3x text-primary"></i>
                </div>
                <h3 className="fw-bold mb-2">Sistema de Coleta de Resíduos</h3>
                <p className="text-muted mb-0">
                  Faça login para acessar o sistema
                </p>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  className="mb-3"
                  dismissible
                  onClose={() => setError("")}
                >
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">E-mail</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    size="lg"
                    className="border-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Senha</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    size="lg"
                    className="border-2"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-3 fw-semibold"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-muted mb-0">
                  Não tem uma conta?{" "}
                  <Link
                    to="/register"
                    className="text-primary text-decoration-none fw-semibold"
                  >
                    Cadastre-se aqui
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
