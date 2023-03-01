import { AnimatePresence } from "framer-motion";
import { useContext, useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { BASENAME } from "./app.defs";
import { AppContext } from "./AppContext";
import City from "./pages/City";
import CityToday from "./pages/CityToday";
import CityYesterday from "./pages/CityYesterday";

import Home from "./pages/Home";
import Intro from "./pages/Intro";
import History from "./pages/History";
import ProjectInfo from "./pages/projectinfo-pages/projectinfo";

const SetGlobalNavigator = () => {
  const appContext = useContext(AppContext);

  const navigate = useNavigate();

  useEffect(() => {
    appContext.setAppCtx((ctx) => ({
      ...ctx,
      globalNavigator: navigate,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appContext.ctx.globalNavigator]);

  return null;
};

function RoutesList() {
  const location = useLocation();

  return (
    <AnimatePresence mode="sync" initial={false}>
      <Routes key={location.pathname} location={location}>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/city" element={<City />} />
        <Route path="/city/yesterday" element={<CityYesterday />} />
        <Route path="/city/today" element={<CityToday />} />
        <Route path="/history" element={<History />} />
        <Route path="/projectinfo" element={<ProjectInfo />} />
      </Routes>
    </AnimatePresence>
  );
}

function CMRoutes() {
  return (
    <BrowserRouter basename={BASENAME}>
      <SetGlobalNavigator />
      <RoutesList />
    </BrowserRouter>
  );
}

export default CMRoutes;
