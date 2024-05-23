import React, { useState, useEffect } from 'react';
import Intro from './components/Intro';
import Outro from './components/Outro';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowIntro((prevShowIntro) => !prevShowIntro);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {showIntro ? <Intro /> : <Outro />}
    </div>
  );
}

export default App;