// QuestionMedia.jsx (Component chung để hiển thị media, giảm trùng lặp UI)
import ReactPlayer from "react-player";
import { MdImageNotSupported } from "react-icons/md";

const QuestionMedia = ({ media }) => {
  if (!media) {
    return (
      <div className="flex-1 min-w-[300px] shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg aspect-4/3">
        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
          <MdImageNotSupported className="w-16 h-16 mb-2" />
          <span className="text-xs font-black uppercase tracking-widest">No Media</span>
        </div>
      </div>
    );
  }
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
        <div className="w-full aspect-4/3 overflow-hidden rounded-lg">
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