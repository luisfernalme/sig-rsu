import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

function DriverModal({ show, onHide, onSubmit, driver, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    email: "",
    birth_date: "",
    license_number: "",
    license_category: "B",
    license_expiration: "",
    hire_date: "",
    status: "active",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || "",
        cpf: driver.cpf || "",
        phone: driver.phone || "",
        email: driver.email || "",
        birth_date: driver.birth_date || "",
        license_number: driver.license_number || "",
        license_category: driver.license_category || "B",
        license_expiration: driver.license_expiration || "",
        hire_date: driver.hire_date || "",
        status: driver.status || "active",
        address: driver.address || "",
        city: driver.city || "",
        state: driver.state || "",
        zip_code: driver.zip_code || "",
        notes: driver.notes || "",
      });
    } else {
      setFormData({
        name: "",
        cpf: "",
        phone: "",
        email: "",
        birth_date: "",
        license_number: "",
        license_category: "B",
        license_expiration: "",
        hire_date: "",
        status: "active",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        notes: "",
      });
    }
    setErrors({});
  }, [driver, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleCPFChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      // Formatar CPF: 000.000.000-00
      if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
      } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{0,3})/, "$1.$2");
      }
      setFormData((prev) => ({ ...prev, cpf: value }));
      if (errors.cpf) {
        setErrors((prev) => ({ ...prev, cpf: null }));
      }
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 11) {
      // Formatar telefone: (00) 00000-0000 ou (00) 0000-0000
      if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
      } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      }
      setFormData((prev) => ({ ...prev, phone: value }));
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: null }));
      }
    }
  };

  const handleZipCodeChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) {
      // Formatar CEP: 00000-000
      if (value.length > 5) {
        value = value.replace(/(\d{5})(\d{0,3})/, "$1-$2");
      }
      setFormData((prev) => ({ ...prev, zip_code: value }));
      if (errors.zip_code) {
        setErrors((prev) => ({ ...prev, zip_code: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (formData.cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (!formData.license_number.trim()) {
      newErrors.license_number = "Número da CNH é obrigatório";
    }

    if (!formData.license_expiration) {
      newErrors.license_expiration = "Validade da CNH é obrigatória";
    }
    // Remover validação de CNH vencida - permitir cadastro e mostrar apenas aviso visual
    // else {
    //   const expirationDate = new Date(formData.license_expiration);
    //   const today = new Date();
    //   today.setHours(0, 0, 0, 0);
    //   if (expirationDate < today) {
    //     newErrors.license_expiration = "CNH está vencida";
    //   }
    // }

    if (!formData.hire_date) {
      newErrors.hire_date = "Data de contratação é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Limpar campos vazios e converter strings vazias em null para campos de data
      const cleanedData = {
        ...formData,
        birth_date: formData.birth_date || null,
        phone: formData.phone || "",
        email: formData.email || "",
        address: formData.address || "",
        city: formData.city || "",
        state: formData.state || "",
        zip_code: formData.zip_code || "",
        notes: formData.notes || "",
      };
      onSubmit(cleanedData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {driver ? "Editar Motorista" : "Novo Motorista"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              Por favor, corrija os erros no formulário.
            </Alert>
          )}

          <h6 className="mb-3 text-primary">Dados Pessoais</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Nome Completo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  placeholder="Nome completo do motorista"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  CPF <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  isInvalid={!!errors.cpf}
                  placeholder="000.000.000-00"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.cpf}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Data de Nascimento</Form.Label>
                <Form.Control
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 mt-4 text-primary">Documentação</h6>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  Número da CNH <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  isInvalid={!!errors.license_number}
                  placeholder="Número da CNH"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.license_number}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Categoria da CNH</Form.Label>
                <Form.Select
                  name="license_category"
                  value={formData.license_category}
                  onChange={handleChange}
                >
                  <option value="B">Categoria B</option>
                  <option value="C">Categoria C</option>
                  <option value="D">Categoria D</option>
                  <option value="E">Categoria E</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  Validade da CNH <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="license_expiration"
                  value={formData.license_expiration}
                  onChange={handleChange}
                  isInvalid={!!errors.license_expiration}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.license_expiration}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 mt-4 text-primary">Informações Profissionais</h6>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Data de Contratação <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  isInvalid={!!errors.hire_date}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.hire_date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Ativo</option>
                  <option value="on_leave">Afastado</option>
                  <option value="inactive">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <h6 className="mb-3 mt-4 text-primary">Endereço</h6>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Endereço</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua, número, complemento"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={5}>
              <Form.Group>
                <Form.Label>Cidade</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Cidade"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="UF"
                  maxLength={2}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>CEP</Form.Label>
                <Form.Control
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleZipCodeChange}
                  placeholder="00000-000"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre o motorista"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default DriverModal;
