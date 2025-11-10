import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

const CollectionModal = ({
  show,
  onHide,
  onSave,
  collection,
  routes,
  vehicles,
}) => {
  const [formData, setFormData] = useState({
    route: "",
    vehicle: "",
    driver_name: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        route: collection.route || "",
        vehicle: collection.vehicle || "",
        driver_name: collection.driver_name || "",
        scheduled_date: collection.scheduled_date || "",
        scheduled_time: collection.scheduled_time || "",
        notes: collection.notes || "",
      });
    } else {
      // Data padrão para hoje
      const today = new Date().toISOString().slice(0, 10);
      setFormData({
        route: "",
        vehicle: "",
        driver_name: "",
        scheduled_date: today,
        scheduled_time: "08:00",
        notes: "",
      });
    }
    setErrors({});
  }, [collection, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo ao editar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.route) {
      newErrors.route = "Selecione uma rota";
    }

    if (!formData.vehicle) {
      newErrors.vehicle = "Selecione um veículo";
    }

    if (!formData.driver_name?.trim()) {
      newErrors.driver_name = "Informe o nome do motorista";
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = "Informe a data agendada";
    }

    if (!formData.scheduled_time) {
      newErrors.scheduled_time = "Informe o horário";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onHide();
    } catch (err) {
      console.error("Erro ao salvar coleta:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-clipboard-list me-2"></i>
          {collection ? "Editar Coleta" : "Nova Coleta"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Rota <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="route"
                  value={formData.route}
                  onChange={handleChange}
                  isInvalid={!!errors.route}
                >
                  <option value="">Selecione uma rota</option>
                  {routes
                    .filter((r) => r.status === "active")
                    .map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.route}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Veículo <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleChange}
                  isInvalid={!!errors.vehicle}
                >
                  <option value="">Selecione um veículo</option>
                  {vehicles
                    .filter((v) => v.status === "active")
                    .map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - {vehicle.brand}{" "}
                        {vehicle.model}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.vehicle}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Nome do Motorista <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={handleChange}
                  placeholder="Digite o nome do motorista"
                  isInvalid={!!errors.driver_name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.driver_name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Data Agendada <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  isInvalid={!!errors.scheduled_date}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.scheduled_date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label>
                  Horário <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  isInvalid={!!errors.scheduled_time}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.scheduled_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label>Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Adicione observações sobre esta coleta (opcional)"
                />
              </Form.Group>
            </Col>
          </Row>

          {Object.keys(errors).length > 0 && (
            <Alert variant="danger" className="mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Por favor, corrija os erros acima antes de continuar.
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Salvando...
            </>
          ) : (
            <>
              <i className="fas fa-save me-2"></i>
              Salvar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CollectionModal;
