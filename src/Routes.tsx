import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Intro from './pages/Intro';

function CMRoutes() {
  return (
    <BrowserRouter basename='/cavamultimediale'>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Intro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default CMRoutes;
