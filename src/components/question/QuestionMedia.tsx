// QuestionMedia.jsx (Component chung để hiển thị media, giảm trùng lặp UI)
import ReactPlayer from "react-player";

const QuestionMedia = ({ media }) => {
  if (!media) return null;
  const isVideo = media.type === "VIDEO";

  return (
    <div className="flex-1">
      {isVideo ? (
        <div className="w-[500px] aspect-[4/3] overflow-hidden rounded-lg">
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
        <div className="w-[500px] aspect-[4/3] overflow-hidden rounded-lg">
          <img
            src={media.url}
            alt="Question media"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionMedia;