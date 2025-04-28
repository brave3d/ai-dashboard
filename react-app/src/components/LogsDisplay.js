import React, { useRef, useEffect } from 'react';

// Placeholder component
function LogsDisplay({ logs }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]); // Dependency array includes logs

  return (
    <div id="logsContainer" className="mt-4 p-4 bg-neutral text-neutral-content rounded-lg shadow max-h-48 overflow-y-auto text-xs font-mono">
      <h3 className="text-md font-semibold mb-2 sticky top-0 bg-neutral pb-1">Logs</h3>
      {logs.map((log, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: log.replace(/\n/g, '<br>') }} />
      ))}
      {logs.length === 0 && <p className="text-gray-400 italic">Generation logs will appear here...</p>}
      <div ref={logsEndRef} /> {/* Element to scroll to */}
    </div>
  );
}

export default LogsDisplay; 