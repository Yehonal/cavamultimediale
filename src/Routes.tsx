import { useContext, useEffect } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";

import Home from "./pages/Home";
import Intro from "./pages/Intro";

const SetGlobalNavigator = () => {
  const appContext = useContext(AppContext);

  const navigate = useNavigate();

  useEffect(() => {
    console.log("SetGlobalNavigator useEffect");
    appContext.setAppCtx((ctx) => ({
      ...ctx,
      globalNavigator: navigate,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

function CMRoutes() {
  return (
    <MemoryRouter>
      <SetGlobalNavigator />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Intro />} />
      </Routes>
    </MemoryRouter>
  );
}

export default CMRoutes;
