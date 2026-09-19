import React, { useEffect } from 'react';

export const BrandFilm: React.FC = () => {
  useEffect(() => {
    document.title = "SERVORA — Official Product Launch Film (4K)";
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020408', border: 'none', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="/brand-film.html"
        title="SERVORA Official Product Launch Film"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        allow="autoplay; camera; microphone; fullscreen; display-capture"
      />
    </div>
  );
};
