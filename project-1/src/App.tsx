import React, { useState, useEffect } from 'react';
import Intro from './components/Intro';
import Outro from './components/Outro';
import Middletro from './components/Middletro';

const App: React.FC = () => {
  const [currentComponent, setCurrentComponent] = useState('Intro');

  useEffect(() => {
    const components = ['Intro', 'Middletro', 'Outro'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % components.length;
      setCurrentComponent(components[index]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {currentComponent === 'Intro' && <Intro />}
      {currentComponent === 'Middletro' && <Middletro />}
      {currentComponent === 'Outro' && <Outro />}
    </div>
  );
}

export default App;