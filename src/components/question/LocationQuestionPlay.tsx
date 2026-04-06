import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap
} from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

const arrowIcon = new Icon({
  iconUrl: "https://res.cloudinary.com/dpfbtypxx/image/upload/v1757436540/ChatGPT_Image_Aug_17__2025__12_27_39_PM-removebg-preview_ginjv1.png",
  iconSize: [80, 80],
  iconAnchor: [40, 40],
});

function FlyToLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lon], 9, { duration: 2 });
    }
  }, [location]);

  return null;
}

import apiClient from "@/api/client";
import endpoints from "../../api/api";

const LocationQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult }) => {
  const [location, setLocation] = useState(null);
  const [correctLocation, setCorrectLocation] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLocation(null);
    setIsCorrect(null);
    setSubmitted(null);
  }, [question.id]);

  useEffect(() => {
    socket.on("answerSubmitted", ({ questionId }) => {
      if (questionId === question.id) {
        console.log(`Submitted location answer`);
      }
    });

    socket.on(
      "answerResult",
      ({
        userId: resUserId,
        isCorrect: resCorrect,
        questionId,
        correctLatLon,
      }) => {
        if (resUserId === userId && questionId === question.id) {
          setIsCorrect(resCorrect);
          if (onResult) onResult(resCorrect);
          if (correctLatLon) {
            setCorrectLocation({
              lat: correctLatLon.latitude,
              lon: correctLatLon.longitude,
            });
          }
        }
      }
    );

    socket.on("error", (message) => {
      console.log("Error:", message);
    });

    return () => {
      socket.off("answerSubmitted");
      socket.off("answerResult");
      socket.off("error");
    };
  }, [socket, userId, question.id]);

  const handleSubmit = async () => {
    if (!location || submitted) return;

    setSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: location
        });
        if (onResult) onResult(res.data.isCorrect);
        if (onHomeworkSubmit) onHomeworkSubmit();
      } catch (err) {
        console.error("Failed to submit homework answer", err);
      }
    } else {
      socket.emit("submitAnswer", {
        matchId,
        userId,
        questionId: question.id,
        answer: location,
      });
      setTimeout(() => setLocation(null), 7000);
    }
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && !submitted && mode !== "HOMEWORK") {
      handleSubmit();
    }
  }, [timer, submitted, mode, location]);

  return (
    <div className="relative w-[90vw] h-screen">
      <MapContainer
        center={[question.data?.initialCenter?.lat || 10.7904, question.data?.initialCenter?.lon || 106.69285]}
        zoom={question.data?.initialZoom || 10}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution={question.optionsData?.mapType === 'SATELLITE' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap contributors &copy; CARTO'}
          url={question.optionsData?.mapType === 'SATELLITE' 
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />
        <LocationPicker setLocation={setLocation} />
        {location && <Marker position={[location.lat, location.lon]} />}
        {correctLocation && (
          <>
            <Marker position={[correctLocation.lat, correctLocation.lon]} icon={arrowIcon} />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={question.optionsData?.radius500 || 30000}
              pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1 }}
            />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={question.optionsData?.radius750 || 15000}
              pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.15 }}
            />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={question.optionsData?.radius1000 || 5000}
              pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2 }}
            />
            <FlyToLocation location={correctLocation} />
          </>
        )}
      </MapContainer>

      {/* Question overlay - glassmorphic */}
      <div
        className="absolute top-16 left-8
                    bg-card/60 backdrop-blur-2xl border-2 border-white/20 rounded-3xl 
                    p-8 shadow-3xl text-foreground w-full max-w-lg pointer-events-auto z-10"
      >
        <h2 className="text-2xl font-black mb-6 text-center wrap-break-word max-w-full drop-shadow-sm">{question.text}</h2>

        {location && (
          <div className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/20">
            <p className="text-sm font-black text-primary text-center uppercase tracking-widest">
              📍 Vị trí đã chọn
            </p>
            <p className="text-lg font-bold text-foreground text-center tabular-nums">
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </p>
          </div>
        )}

        <Button
          className="w-full h-16 text-xl font-black bg-primary text-primary-foreground rounded-2xl shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
          onClick={handleSubmit}
          disabled={submitted || !location || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
        >
          XÁC NHẬN
        </Button>
      </div>
    </div>
  );
};

export default LocationQuestionPlay;
