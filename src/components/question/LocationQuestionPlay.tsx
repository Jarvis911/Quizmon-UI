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

const LocationQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult, onAnswered }) => {
  const [location, setLocation] = useState(null);
  const [correctLocation, setCorrectLocation] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLocation(null);
    setIsCorrect(null);
    setSubmitted(false);
    setCorrectLocation(null);
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
    onAnswered?.(); // Notify parent immediately

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
    <div className="relative w-full h-[60vh] md:h-full bg-card/20 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
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
            <Marker position={[correctLocation.lat, correctLocation.lon]} />
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

      {/* Question overlay - Tiny & Tucked in the corner */}
      <div
        className="absolute bottom-3 left-3 right-3 md:right-auto md:bottom-6 md:left-6
                    bg-card/30 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-3xl
                    p-3 md:p-4 shadow-2xl text-foreground md:w-[280px] pointer-events-auto z-10 
                    animate-in slide-in-from-bottom-4 duration-700"
      >
        <h2 className="text-[13px] md:text-sm font-black mb-2 md:mb-3 leading-tight drop-shadow-sm line-clamp-2 md:line-clamp-3">{question.text}</h2>

        {location && (
          <div className="bg-primary/10 rounded-lg p-2 mb-3 border border-primary/20 flex items-center justify-between">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">
               Tọa độ
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums leading-none">
              {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </span>
          </div>
        )}

        <Button
          className="w-full h-10 md:h-12 text-sm font-black bg-primary text-primary-foreground rounded-lg md:rounded-xl shadow-lg hover:-translate-y-px active:translate-y-px transition-all"
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
