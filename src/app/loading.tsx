export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="relative flex flex-col items-center">
        {/* Glow Effect Behind */}
        <div className="absolute w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Rocket Icon */}
        <div className="animate-rocket relative z-10 mb-6">
          <i className="fa-solid fa-rocket text-6xl text-white rocket-engine"></i>
        </div>

        {/* Loading Text */}
        <div className="text-center relative z-10">
          <p className="text-xl font-black text-white uppercase tracking-[0.3em] flex items-center justify-center">
            Loading
            <span className="flex ml-2">
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
            </span>
          </p>
          <p className="text-[10px] text-amber-300 font-bold uppercase tracking-widest mt-1 animate-pulse">
            Preparing for Mission
          </p>
        </div>
      </div>
    </div>
  );
}
