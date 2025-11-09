import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useAuth } from "../services/authContext";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("info");

  // Estado para informações do perfil
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Estado para alteração de senha
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.first_name.trim()) {
      newErrors.first_name = "Nome é obrigatório";
    }

    if (!profileData.last_name.trim()) {
      newErrors.last_name = "Sobrenome é obrigatório";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "E-mail inválido";
    }

    if (profileData.phone && profileData.phone.length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.old_password) {
      newErrors.old_password = "Senha atual é obrigatória";
    }

    if (!passwordData.new_password) {
      newErrors.new_password = "Nova senha é obrigatória";
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = "Senha deve ter no mínimo 8 caracteres";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)
    ) {
      newErrors.new_password =
        "Senha deve conter letras maiúsculas, minúsculas e números";
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = "Confirmação de senha é obrigatória";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoadingProfile(true);

    try {
      const result = await updateProfile(profileData);

      if (result.success) {
        toast.success("Perfil atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setIsLoadingPassword(true);

    try {
      const result = await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      if (result.success) {
        toast.success("Senha alterada com sucesso!");
        // Limpar campos
        setPasswordData({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      if (error.response?.data) {
        const apiErrors = error.response.data;
        setErrors(apiErrors);
      }
      toast.error("Erro ao alterar senha");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: "Administrador", variant: "danger" },
      operator: { label: "Operador", variant: "primary" },
      viewer: { label: "Visualizador", variant: "secondary" },
    };
    return roles[role] || { label: role, variant: "secondary" };
  };

  if (!user) {
    return (
      <Container>
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Carregando informações do perfil...
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-user-circle me-2"></i>
            Meu Perfil
          </h2>
          <p className="text-muted">
            Gerencie suas informações pessoais e configurações
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          {/* Card de Informações do Usuário */}
          <Card className="shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <div
                  className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center text-white"
                  style={{
                    width: "100px",
                    height: "100px",
                    fontSize: "2.5rem",
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
              </div>
              <h4 className="mb-1">
                {user.first_name} {user.last_name}
              </h4>
              <p className="text-muted mb-2">@{user.username}</p>
              <span
                className={`badge bg-${getRoleBadge(user.role).variant} mb-3`}
              >
                {getRoleBadge(user.role).label}
              </span>
              <hr />
              <div className="text-start">
                <p className="mb-2">
                  <i className="fas fa-envelope text-muted me-2"></i>
                  <small>{user.email}</small>
                </p>
                {user.phone && (
                  <p className="mb-2">
                    <i className="fas fa-phone text-muted me-2"></i>
                    <small>{user.phone}</small>
                  </p>
                )}
                <p className="mb-0">
                  <i className="fas fa-calendar text-muted me-2"></i>
                  <small>
                    Membro desde{" "}
                    {new Date(user.date_joined).toLocaleDateString("pt-BR")}
                  </small>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                {/* Aba de Informações Pessoais */}
                <Tab
                  eventKey="info"
                  title={
                    <>
                      <i className="fas fa-user me-2"></i>Informações Pessoais
                    </>
                  }
                >
                  <Form onSubmit={handleProfileSubmit}>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-user me-2"></i>
                            Nome de Usuário
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={profileData.username}
                            disabled
                            className="bg-light"
                          />
                          <Form.Text className="text-muted">
                            O nome de usuário não pode ser alterado
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-envelope me-2"></i>
                            E-mail *
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            isInvalid={!!errors.email}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-id-card me-2"></i>
                            Nome *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={profileData.first_name}
                            onChange={handleProfileChange}
                            isInvalid={!!errors.first_name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-id-card me-2"></i>
                            Sobrenome *
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={profileData.last_name}
                            onChange={handleProfileChange}
                            isInvalid={!!errors.last_name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-phone me-2"></i>
                            Telefone
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            placeholder="(00) 00000-0000"
                            isInvalid={!!errors.phone}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-briefcase me-2"></i>
                            Função
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={getRoleBadge(user.role).label}
                            disabled
                            className="bg-light"
                          />
                          <Form.Text className="text-muted">
                            Contate um administrador para alterar sua função
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <hr />

                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoadingProfile}
                      >
                        {isLoadingProfile ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab>

                {/* Aba de Segurança */}
                <Tab
                  eventKey="security"
                  title={
                    <>
                      <i className="fas fa-lock me-2"></i>Segurança
                    </>
                  }
                >
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Use uma senha forte com no mínimo 8 caracteres, incluindo
                    letras maiúsculas, minúsculas e números.
                  </Alert>

                  <Form onSubmit={handlePasswordSubmit}>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-key me-2"></i>
                            Senha Atual *
                          </Form.Label>
                          <div className="input-group">
                            <Form.Control
                              type={showPasswords.old ? "text" : "password"}
                              name="old_password"
                              value={passwordData.old_password}
                              onChange={handlePasswordChange}
                              placeholder="Digite sua senha atual"
                              isInvalid={!!errors.old_password}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  old: !prev.old,
                                }))
                              }
                            >
                              <i
                                className={`fas fa-eye${
                                  showPasswords.old ? "-slash" : ""
                                }`}
                              ></i>
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {errors.old_password}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-lock me-2"></i>
                            Nova Senha *
                          </Form.Label>
                          <div className="input-group">
                            <Form.Control
                              type={showPasswords.new ? "text" : "password"}
                              name="new_password"
                              value={passwordData.new_password}
                              onChange={handlePasswordChange}
                              placeholder="Digite a nova senha"
                              isInvalid={!!errors.new_password}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  new: !prev.new,
                                }))
                              }
                            >
                              <i
                                className={`fas fa-eye${
                                  showPasswords.new ? "-slash" : ""
                                }`}
                              ></i>
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {errors.new_password}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>
                            <i className="fas fa-lock me-2"></i>
                            Confirmar Nova Senha *
                          </Form.Label>
                          <div className="input-group">
                            <Form.Control
                              type={showPasswords.confirm ? "text" : "password"}
                              name="confirm_password"
                              value={passwordData.confirm_password}
                              onChange={handlePasswordChange}
                              placeholder="Confirme a nova senha"
                              isInvalid={!!errors.confirm_password}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() =>
                                setShowPasswords((prev) => ({
                                  ...prev,
                                  confirm: !prev.confirm,
                                }))
                              }
                            >
                              <i
                                className={`fas fa-eye${
                                  showPasswords.confirm ? "-slash" : ""
                                }`}
                              ></i>
                            </Button>
                            <Form.Control.Feedback type="invalid">
                              {errors.confirm_password}
                            </Form.Control.Feedback>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <hr />

                    <div className="d-flex justify-content-end">
                      <Button
                        variant="warning"
                        type="submit"
                        disabled={isLoadingPassword}
                      >
                        {isLoadingPassword ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Alterando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-key me-2"></i>
                            Alterar Senha
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
