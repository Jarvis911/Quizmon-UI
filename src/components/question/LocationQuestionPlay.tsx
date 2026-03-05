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

import axios from "axios";
import endpoints from "../../api/api";

const LocationQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit }) => {
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
        const token = localStorage.getItem("token");
        await axios.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerIds: [],
          textAnswer: `${location.lat},${location.lon}`
        }, {
          headers: { Authorization: token }
        });
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
        center={[10.7904, 106.69285]}
        zoom={10}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <LocationPicker setLocation={setLocation} />
        {location && <Marker position={[location.lat, location.lon]} />}
        {correctLocation && (
          <>
            <Marker position={[correctLocation.lat, correctLocation.lon]} icon={arrowIcon} />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={30000}
              pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1 }}
            />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={20000}
              pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.15 }}
            />
            <Circle
              center={[correctLocation.lat, correctLocation.lon]}
              radius={10000}
              pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2 }}
            />
            <FlyToLocation location={correctLocation} />
          </>
        )}
      </MapContainer>

      {/* Question overlay - glassmorphic */}
      <div
        className="absolute top-16 left-8
                    bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl 
                    p-6 shadow-2xl text-white w-[400px] pointer-events-auto z-10"
      >
        <h2 className="text-xl font-bold mb-4 text-center">{question.text}</h2>

        {location && (
          <p className="text-sm text-white/50 mb-3 text-center">
            📍 {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
          </p>
        )}

        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-3"
          onClick={handleSubmit}
          disabled={submitted || !location || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
        >
          ✅ Xác nhận
        </Button>
      </div>
    </div>
  );
};

export default LocationQuestionPlay;
