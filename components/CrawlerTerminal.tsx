
import React, { useEffect, useRef } from 'react';

interface CrawlerTerminalProps {
  logs: string[];
}

const CrawlerTerminal: React.FC<CrawlerTerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-[0_0_50px_rgba(0,255,127,0.1)] overflow-hidden font-mono text-sm relative backdrop-blur-md bg-opacity-80">
      <div className="bg-[#121212] px-4 py-2 border-b border-gray-800 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        <span className="ml-2 text-gray-400 text-xs tracking-wider">
          douban_spider_realtime.exe
        </span>
      </div>
      <div 
        ref={scrollRef}
        className="p-6 h-96 overflow-y-auto text-green-400 space-y-2 scanline bg-black/90 font-mono leading-relaxed"
      >
        {logs.length === 0 && (
            <div className="opacity-50 text-gray-500">Waiting for command...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="opacity-90 hover:opacity-100 transition-opacity break-all">
            <span className="text-green-600 mr-2">$</span>
            {log}
          </div>
        ))}
        <div className="animate-pulse text-green-500">_</div>
      </div>
    </div>
  );
};

export default CrawlerTerminal;
