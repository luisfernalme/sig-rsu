import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";

const defaultForm = {
  license_plate: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  vehicle_type: "truck",
  capacity_weight: "",
  capacity_volume: "",
  fuel_capacity: "",
  status: "active",
  current_odometer: 0,
  purchase_value: "",
  last_maintenance: "",
  next_maintenance: "",
};

const VehicleModal = ({
  show,
  onHide,
  onSave,
  vehicle = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        vehicle_type: vehicle.vehicle_type || "truck",
        capacity_weight: vehicle.capacity_weight ?? "",
        capacity_volume: vehicle.capacity_volume ?? "",
        fuel_capacity: vehicle.fuel_capacity ?? "",
        status: vehicle.status || "active",
        current_odometer: vehicle.current_odometer ?? 0,
        purchase_value: vehicle.purchase_value ?? "",
        last_maintenance: vehicle.last_maintenance || "",
        next_maintenance: vehicle.next_maintenance || "",
      });
    } else if (show) {
      setFormData(defaultForm);
    }
  }, [vehicle, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.license_plate.trim())
      newErrors.license_plate = "Placa é obrigatória";
    if (!formData.brand.trim()) newErrors.brand = "Marca é obrigatória";
    if (!formData.model.trim()) newErrors.model = "Modelo é obrigatório";
    if (!formData.year || Number(formData.year) < 1900)
      newErrors.year = "Ano inválido";
    if (!formData.vehicle_type) newErrors.vehicle_type = "Tipo é obrigatório";
    // Capacidades não são mais obrigatórias
    return newErrors;
  };

  const normalizePayload = () => {
    return {
      ...formData,
      year: Number(formData.year),
      capacity_weight: parseFloat(formData.capacity_weight) || 0,
      capacity_volume: parseFloat(formData.capacity_volume) || 0,
      fuel_capacity: parseFloat(formData.fuel_capacity) || 0,
      current_odometer: parseFloat(formData.current_odometer) || 0,
      purchase_value:
        formData.purchase_value === ""
          ? null
          : typeof formData.purchase_value === "number"
          ? formData.purchase_value
          : parseFloat(formData.purchase_value),
      last_maintenance: formData.last_maintenance || null,
      next_maintenance: formData.next_maintenance || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = validate();
    if (Object.keys(val).length > 0) {
      setErrors(val);
      return;
    }

    try {
      setSubmitting(true);
      const payload = normalizePayload();
      await onSave(payload);
      onHide();
    } catch (err) {
      const apiErrors = err?.response?.data || {};
      setErrors((prev) => ({
        ...prev,
        submit: apiErrors.detail || "Erro ao salvar veículo",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setFormData(defaultForm);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-truck me-2"></i>
          {vehicle ? "Editar Veículo" : "Novo Veículo"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.submit && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setErrors((p) => ({ ...p, submit: null }))}
            >
              {String(errors.submit)}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Placa *</Form.Label>
                <Form.Control
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  placeholder="ABC1D23"
                  isInvalid={!!errors.license_plate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.license_plate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Ano *</Form.Label>
                <Form.Control
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  isInvalid={!!errors.year}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.year}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Ativo</option>
                  <option value="maintenance">Em Manutenção</option>
                  <option value="inactive">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca *</Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  isInvalid={!!errors.brand}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.brand}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Modelo *</Form.Label>
                <Form.Control
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  isInvalid={!!errors.model}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.model}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo *</Form.Label>
                <Form.Select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                >
                  <option value="truck">Caminhão</option>
                  <option value="compactor">Compactador</option>
                  <option value="pickup">Caminhonete</option>
                  <option value="other">Outro</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacidade Peso (kg)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="capacity_weight"
                      value={formData.capacity_weight}
                      onChange={handleChange}
                      isInvalid={!!errors.capacity_weight}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.capacity_weight}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacidade Volume (m³)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="capacity_volume"
                      value={formData.capacity_volume}
                      onChange={handleChange}
                      isInvalid={!!errors.capacity_volume}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.capacity_volume}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Capacidade do Tanque (L)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="fuel_capacity"
                  value={formData.fuel_capacity}
                  onChange={handleChange}
                  isInvalid={!!errors.fuel_capacity}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fuel_capacity}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Odômetro Atual (km)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="current_odometer"
                  value={formData.current_odometer}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Valor de Compra (R$)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="purchase_value"
                  value={formData.purchase_value}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Última Manutenção</Form.Label>
                <Form.Control
                  type="date"
                  name="last_maintenance"
                  value={formData.last_maintenance || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Próxima Manutenção</Form.Label>
                <Form.Control
                  type="date"
                  name="next_maintenance"
                  value={formData.next_maintenance || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting || loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || loading}
          >
            {submitting || loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                {vehicle ? "Atualizar" : "Criar"} Veículo
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default VehicleModal;
