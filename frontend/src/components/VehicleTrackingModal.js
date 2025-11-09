import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { vehiclesAPI } from "../services/api";

// Fix ícones Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const VehicleTrackingModal = ({ show, onHide, vehicle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tracks, setTracks] = useState([]);

  const center = useMemo(() => {
    if (tracks.length > 0) {
      const t = tracks[0];
      return [t.latitude, t.longitude];
    }
    // Fallback: Brasília
    return [-15.7942, -47.8825];
  }, [tracks]);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!vehicle || !show) return;
      setLoading(true);
      setError(null);
      try {
        const data = await vehiclesAPI.getVehicleTracking(vehicle.id);
        // Converter para formato [lat, lng]
        setTracks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Não foi possível carregar o rastreamento.");
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [vehicle, show]);

  const polylinePoints = useMemo(() => {
    return tracks.map((t) => [t.latitude, t.longitude]);
  }, [tracks]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-map-marker-alt me-2"></i>
          Rastreamento: {vehicle?.license_plate}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" />
            <div className="mt-2 small text-muted">
              Carregando rastreamento...
            </div>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (
          <div style={{ height: "420px" }}>
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {polylinePoints.length > 1 && (
                <Polyline
                  positions={polylinePoints}
                  color="green"
                  weight={4}
                  opacity={0.8}
                />
              )}
              {polylinePoints.length > 0 && (
                <Marker position={polylinePoints[0]}></Marker>
              )}
              {polylinePoints.length > 1 && (
                <Marker
                  position={polylinePoints[polylinePoints.length - 1]}
                ></Marker>
              )}
            </MapContainer>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VehicleTrackingModal;
