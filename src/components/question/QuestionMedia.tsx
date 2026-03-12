import ReactPlayer from "react-player";
import { MdImageNotSupported } from "react-icons/md";

const QuestionMedia = ({ media }) => {
  if (!media) {
    return (
      <div className="flex-1 min-w-[300px] flex-shrink-0">
        <div className="w-full aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <MdImageNotSupported className="w-16 h-16 text-slate-300 dark:text-slate-600" />
        </div>
      </div>
    );
  }
  const isVideo = media.type === "VIDEO";

  return (
    <div className="flex-1 min-w-[300px] flex-shrink-0">
      {isVideo ? (
        <div className="w-full aspect-[4/3] overflow-hidden rounded-lg">
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
        <div className="w-full aspect-[4/3] overflow-hidden rounded-lg">
          <img
            src={media.url}
            alt="Question media"
            className="w-full h-full object-cover max-w-full"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionMedia;