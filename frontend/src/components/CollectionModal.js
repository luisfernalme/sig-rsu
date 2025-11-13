import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { routesAPI } from "../services/api";

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
    registration_mode: "total", // "total" (total da rota) ou "by_point" (por ponto)
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
    // Itens por ponto de coleta
    collection_items: [],
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);

  useEffect(() => {
    if (collection) {
      setFormData({
        collection_type:
          collection.status === "completed" ? "completed" : "future",
        registration_mode: "total",
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
        collection_items: [],
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
        registration_mode: "total",
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
        collection_items: [],
      });
    }
    setErrors({});
  }, [collection, show]);

  // Buscar pontos da rota quando ela for selecionada E quando o modo for "by_point"
  useEffect(() => {
    if (formData.route && formData.registration_mode === "by_point") {
      setLoadingPoints(true);

      routesAPI
        .getRoute(formData.route)
        .then((fullRoute) => {
          if (
            fullRoute.collection_points &&
            fullRoute.collection_points.length > 0
          ) {
            const points = fullRoute.collection_points.map((point) => ({
              collection_point: point.id,
              point_name:
                point.name ||
                point.collection_point_name ||
                `Ponto ${point.id}`,
              sequence_order: point.sequence_order,
              collected: false,
              waste_collected_weight: "",
              waste_collected_volume: "",
              notes: "",
            }));

            setFormData((prev) => ({
              ...prev,
              collection_items: points,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              collection_items: [],
            }));
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar pontos da rota:", error);
          setFormData((prev) => ({
            ...prev,
            collection_items: [],
          }));
        })
        .finally(() => {
          setLoadingPoints(false);
        });
    } else if (formData.registration_mode === "total") {
      // Limpar pontos ao voltar para modo total
      setFormData((prev) => ({
        ...prev,
        collection_items: [],
      }));
    }
  }, [formData.route, formData.registration_mode]);

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

  const handlePointDataChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      collection_items: prev.collection_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
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

        // Verificar modo de registro
        if (formData.registration_mode === "total") {
          // Registro total da rota
          dataToSend.waste_collected_weight =
            formData.waste_collected_weight || null;
          dataToSend.waste_collected_volume =
            formData.waste_collected_volume || null;
        } else {
          // Registro por ponto
          dataToSend.collection_items = formData.collection_items
            .filter((item) => item.collected)
            .map((item) => ({
              collection_point: item.collection_point,
              weight: parseFloat(item.waste_collected_weight) || 0,
              collected: item.collected,
              notes: item.notes || "",
            }));

          // Calcular peso total dos pontos coletados
          const totalWeight = formData.collection_items
            .filter((item) => item.collected)
            .reduce(
              (sum, item) =>
                sum + (parseFloat(item.waste_collected_weight) || 0),
              0
            );
          dataToSend.waste_collected_weight = totalWeight;

          // Volume precisa ser informado separadamente no modo por ponto
          dataToSend.waste_collected_volume =
            formData.waste_collected_volume || null;
        }

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

              {/* Modo de registro de resíduos */}
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      <i className="fas fa-weight me-2"></i>
                      Modo de Registro de Resíduos
                    </Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        id="mode-total"
                        name="registration_mode"
                        value="total"
                        checked={formData.registration_mode === "total"}
                        onChange={handleChange}
                        label={
                          <span>
                            <i className="fas fa-list me-2 text-success"></i>
                            Total da Rota
                          </span>
                        }
                      />
                      <Form.Check
                        type="radio"
                        id="mode-by-point"
                        name="registration_mode"
                        value="by_point"
                        checked={formData.registration_mode === "by_point"}
                        onChange={handleChange}
                        label={
                          <span>
                            <i className="fas fa-map-marker-alt me-2 text-info"></i>
                            Por Ponto de Coleta
                          </span>
                        }
                      />
                    </div>
                    <Form.Text className="text-muted">
                      {formData.registration_mode === "total"
                        ? "Informe apenas o total coletado em toda a rota"
                        : "Registre a quantidade coletada em cada ponto individualmente"}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {formData.registration_mode === "total" ? (
                // Registro total da rota
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
              ) : (
                // Registro por ponto
                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Label className="fw-bold mb-3">
                      <i className="fas fa-clipboard-list me-2"></i>
                      Quantidade por Ponto de Coleta
                    </Form.Label>
                    {loadingPoints ? (
                      <Alert variant="info">
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Carregando pontos de coleta...
                      </Alert>
                    ) : formData.collection_items.length === 0 ? (
                      <Alert variant="info">
                        <i className="fas fa-info-circle me-2"></i>
                        Selecione uma rota para visualizar seus pontos de
                        coleta.
                      </Alert>
                    ) : (
                      <div
                        className="border rounded p-3"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                      >
                        {formData.collection_items.map((item, index) => (
                          <Row key={index} className="mb-2 align-items-center">
                            <Col md={8}>
                              <Form.Check
                                type="checkbox"
                                id={`point-${index}`}
                                checked={item.collected}
                                onChange={(e) =>
                                  handlePointDataChange(
                                    index,
                                    "collected",
                                    e.target.checked
                                  )
                                }
                                label={
                                  <span>
                                    <strong>{item.point_name}</strong>
                                    <small className="text-muted ms-2">
                                      (Ordem: {item.sequence_order})
                                    </small>
                                  </span>
                                }
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Peso (kg)"
                                value={item.waste_collected_weight}
                                onChange={(e) =>
                                  handlePointDataChange(
                                    index,
                                    "waste_collected_weight",
                                    e.target.value
                                  )
                                }
                                disabled={!item.collected}
                                size="sm"
                              />
                            </Col>
                          </Row>
                        ))}

                        {/* Totalizador */}
                        {formData.collection_items.some(
                          (item) => item.collected
                        ) && (
                          <div className="mt-3 pt-3 border-top">
                            <Row>
                              <Col>
                                <strong>Peso Total: </strong>
                                {formData.collection_items
                                  .filter((item) => item.collected)
                                  .reduce(
                                    (sum, item) =>
                                      sum +
                                      (parseFloat(
                                        item.waste_collected_weight
                                      ) || 0),
                                    0
                                  )
                                  .toFixed(2)}{" "}
                                kg
                              </Col>
                            </Row>
                          </div>
                        )}
                      </div>
                    )}
                  </Col>
                </Row>
              )}

              {/* Campo de volume total (opcional no modo por ponto) */}
              {formData.registration_mode === "by_point" &&
                formData.collection_items.length > 0 && (
                  <Row className="mt-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>
                          Volume Total Coletado (m³)
                          <small className="text-muted ms-2">(opcional)</small>
                        </Form.Label>
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
                          Volume total de resíduos coletados em metros cúbicos
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
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
