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
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    password_confirm: "",
    role: "viewer", // Padrão: visualizador
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = "Nome de usuário é obrigatório";
    } else if (formData.username.length < 3) {
      newErrors.username = "Nome de usuário deve ter no mínimo 3 caracteres";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Validar nome
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Nome é obrigatório";
    }

    // Validar sobrenome
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Sobrenome é obrigatório";
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Senha deve conter letras maiúsculas, minúsculas e números";
    }

    // Validar confirmação de senha
    if (!formData.password_confirm) {
      newErrors.password_confirm = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.register(formData);

      // Salvar tokens
      Cookies.set("access_token", response.tokens.access, { expires: 1 });
      Cookies.set("refresh_token", response.tokens.refresh, { expires: 7 });

      toast.success("Cadastro realizado com sucesso! Bem-vindo!");

      // Redirecionar para o dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Erro ao registrar:", error);

      if (error.response?.data) {
        const apiErrors = error.response.data;

        // Mapear erros da API para o formulário
        const formErrors = {};
        Object.keys(apiErrors).forEach((key) => {
          if (Array.isArray(apiErrors[key])) {
            formErrors[key] = apiErrors[key][0];
          } else {
            formErrors[key] = apiErrors[key];
          }
        });

        setErrors(formErrors);
        toast.error("Erro ao realizar cadastro. Verifique os campos.");
      } else {
        toast.error("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5"
    >
      <Row className="w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={5} className="mx-auto">
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <i className="fas fa-recycle fa-3x text-primary mb-3"></i>
                <h3 className="card-title">Criar Nova Conta</h3>
                <p className="text-muted">
                  Preencha os dados abaixo para se cadastrar
                </p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row>
                  {/* Username */}
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-user me-2"></i>
                        Nome de Usuário *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Digite um nome de usuário único"
                        isInvalid={!!errors.username}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Email */}
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-envelope me-2"></i>
                        E-mail *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Nome */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-id-card me-2"></i>
                        Nome *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        isInvalid={!!errors.first_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.first_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Sobrenome */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-id-card me-2"></i>
                        Sobrenome *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Seu sobrenome"
                        isInvalid={!!errors.last_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.last_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Telefone */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-phone me-2"></i>
                        Telefone
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        isInvalid={!!errors.phone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">Opcional</Form.Text>
                    </Form.Group>
                  </Col>

                  {/* Função */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-briefcase me-2"></i>
                        Função *
                      </Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        isInvalid={!!errors.role}
                      >
                        <option value="viewer">Visualizador</option>
                        <option value="operator">Operador</option>
                        <option value="admin">Administrador</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.role}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {/* Senha */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-lock me-2"></i>
                        Senha *
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Digite sua senha"
                          isInvalid={!!errors.password}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          <i
                            className={`fas fa-eye${
                              showPassword ? "-slash" : ""
                            }`}
                          ></i>
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </div>
                      <Form.Text className="text-muted">
                        Mínimo 8 caracteres com letras e números
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  {/* Confirmar Senha */}
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>
                        <i className="fas fa-lock me-2"></i>
                        Confirmar Senha *
                      </Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type={showPasswordConfirm ? "text" : "password"}
                          name="password_confirm"
                          value={formData.password_confirm}
                          onChange={handleChange}
                          placeholder="Confirme sua senha"
                          isInvalid={!!errors.password_confirm}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() =>
                            setShowPasswordConfirm(!showPasswordConfirm)
                          }
                          tabIndex="-1"
                        >
                          <i
                            className={`fas fa-eye${
                              showPasswordConfirm ? "-slash" : ""
                            }`}
                          ></i>
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password_confirm}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Erro geral */}
                {errors.non_field_errors && (
                  <Alert variant="danger" className="mb-3">
                    {errors.non_field_errors}
                  </Alert>
                )}

                {/* Botões */}
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus me-2"></i>
                        Criar Conta
                      </>
                    )}
                  </Button>
                </div>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <small className="text-muted">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="text-decoration-none">
                    <strong>Faça login aqui</strong>
                  </Link>
                </small>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center mt-3">
            <small className="text-muted">* Campos obrigatórios</small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
