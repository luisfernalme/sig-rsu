import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";

const CollectionModal = ({
  show,
  onHide,
  onSave,
  collection,
  routes,
  vehicles,
  drivers,
}) => {
  const [formData, setFormData] = useState({
    collection_type: "future", // "future" (agendada) ou "completed" (já realizada)
    route: "",
    vehicle: "",
    driver: "",
    scheduled_date: "",
    scheduled_time: "",
    // Campos para coleta já realizada
    actual_start_time: "",
    actual_end_time: "",
    waste_collected_weight: "",
    waste_collected_volume: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        collection_type:
          collection.status === "completed" ? "completed" : "future",
        route: collection.route || "",
        vehicle: collection.vehicle || "",
        driver: collection.driver || "",
        scheduled_date: collection.scheduled_date || "",
        scheduled_time: collection.scheduled_time || "",
        actual_start_time: collection.actual_start_time || "",
        actual_end_time: collection.actual_end_time || "",
        waste_collected_weight: collection.waste_collected_weight || "",
        waste_collected_volume: collection.waste_collected_volume || "",
        notes: collection.notes || "",
      });
    } else {
      // Data padrão para hoje
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      setFormData({
        collection_type: "future",
        route: "",
        vehicle: "",
        driver: "",
        scheduled_date: today,
        scheduled_time: "08:00",
        actual_start_time: currentTime,
        actual_end_time: "",
        waste_collected_weight: "",
        waste_collected_volume: "",
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

    if (!formData.driver) {
      newErrors.driver = "Selecione um motorista";
    }

    if (formData.collection_type === "future") {
      // Validações para coleta agendada (futura)
      if (!formData.scheduled_date) {
        newErrors.scheduled_date = "Informe a data agendada";
      }

      if (!formData.scheduled_time) {
        newErrors.scheduled_time = "Informe o horário";
      }
    } else {
      // Validações para coleta já realizada
      if (!formData.scheduled_date) {
        newErrors.scheduled_date = "Informe a data da coleta";
      }

      if (!formData.actual_start_time) {
        newErrors.actual_start_time = "Informe o horário de início";
      }

      if (!formData.actual_end_time) {
        newErrors.actual_end_time = "Informe o horário de término";
      }

      // Validar que horário de término é posterior ao início
      if (formData.actual_start_time && formData.actual_end_time) {
        if (formData.actual_end_time <= formData.actual_start_time) {
          newErrors.actual_end_time =
            "Horário de término deve ser posterior ao início";
        }
      }
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
      // Preparar dados para envio
      const dataToSend = {
        route: formData.route,
        vehicle: formData.vehicle,
        driver: formData.driver,
        scheduled_date: formData.scheduled_date,
        notes: formData.notes,
      };

      if (formData.collection_type === "future") {
        // Coleta agendada (futura)
        dataToSend.scheduled_time = formData.scheduled_time;
      } else {
        // Coleta já realizada - enviar dados de conclusão
        dataToSend.scheduled_time = formData.actual_start_time;
        dataToSend.actual_start_time = formData.actual_start_time;
        dataToSend.actual_end_time = formData.actual_end_time;
        dataToSend.waste_collected_weight =
          formData.waste_collected_weight || null;
        dataToSend.waste_collected_volume =
          formData.waste_collected_volume || null;
        dataToSend.status = "completed";
      }

      await onSave(dataToSend);
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
          {/* Tipo de Coleta */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-bold">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Tipo de Coleta
                </Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="type-future"
                    name="collection_type"
                    value="future"
                    checked={formData.collection_type === "future"}
                    onChange={handleChange}
                    label={
                      <span>
                        <i className="fas fa-calendar-plus me-2 text-primary"></i>
                        Coleta Futura (Agendada)
                      </span>
                    }
                  />
                  <Form.Check
                    type="radio"
                    id="type-completed"
                    name="collection_type"
                    value="completed"
                    checked={formData.collection_type === "completed"}
                    onChange={handleChange}
                    label={
                      <span>
                        <i className="fas fa-calendar-check me-2 text-success"></i>
                        Coleta Já Realizada
                      </span>
                    }
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

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
                  Motorista <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="driver"
                  value={formData.driver}
                  onChange={handleChange}
                  isInvalid={!!errors.driver}
                >
                  <option value="">Selecione um motorista</option>
                  {drivers
                    ?.filter((d) => d.status === "active")
                    .map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - CNH: {driver.license_number} (
                        {driver.license_category_display})
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.driver}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Campos condicionais baseados no tipo */}
          {formData.collection_type === "future" ? (
            // Campos para coleta agendada (futura)
            <>
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
            </>
          ) : (
            // Campos para coleta já realizada
            <>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>
                      Data da Coleta <span className="text-danger">*</span>
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
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>
                      Horário de Início <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="actual_start_time"
                      value={formData.actual_start_time}
                      onChange={handleChange}
                      isInvalid={!!errors.actual_start_time}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.actual_start_time}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>
                      Horário de Término <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="actual_end_time"
                      value={formData.actual_end_time}
                      onChange={handleChange}
                      isInvalid={!!errors.actual_end_time}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.actual_end_time}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Peso Coletado (kg)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="waste_collected_weight"
                      value={formData.waste_collected_weight}
                      onChange={handleChange}
                      placeholder="Ex: 1500"
                    />
                    <Form.Text className="text-muted">
                      Quantidade de resíduos coletados em quilogramas
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Volume Coletado (m³)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="waste_collected_volume"
                      value={formData.waste_collected_volume}
                      onChange={handleChange}
                      placeholder="Ex: 8.5"
                    />
                    <Form.Text className="text-muted">
                      Volume de resíduos coletados em metros cúbicos
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}

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
