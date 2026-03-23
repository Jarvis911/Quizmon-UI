// QuestionMedia.jsx (Component chung để hiển thị media, giảm trùng lặp UI)
import ReactPlayer from "react-player";
import { MdImageNotSupported } from "react-icons/md";

const QuestionMedia = ({ media }) => {
  if (!media) return null;
  const isVideo = media.type === "VIDEO";

  return (
    <div className="flex-1 min-w-[300px] shrink-0">
      {isVideo ? (
        <div className="w-full aspect-4/3 overflow-hidden rounded-lg">
          <ReactPlayer
            url={media.url}
            controls={false}
            playing={true}
            loop={true}
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: {
                  start: media.startTime,
                  end: media.startTime + media.duration,
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="w-full aspect-square overflow-hidden rounded-lg bg-black/5 flex items-center justify-center">
          <img
            src={media.url}
            alt="Question media"
            className={`w-full h-full object-cover max-w-full ${
              media.effect === "BLUR_TO_CLEAR" ? "animate-blur-to-clear" :
              media.effect === "ZOOM_OUT" ? "animate-zoom-out-5x" : ""
            }`}
            style={media.effect === "ZOOM_OUT" ? {
              transformOrigin: `${(media.zoomX ?? 0.5) * 100}% ${(media.zoomY ?? 0.5) * 100}%`
            } : {}}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionMedia;