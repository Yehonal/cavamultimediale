import "./App.css";
import { useAppStatus, AppContext } from "./AppContext";
import BgMusic, { BgMusicContext, useMusicStatus } from "./components/BgMusic";
import {
  LanguageContext,
  useLanguageStatus,
} from "./components/LanguageToggle";
import Layout from "./layouts/MainLayout";
import Routes from "./Routes";

function App() {
  const musicStatus = useMusicStatus();
  const appStatus = useAppStatus();

  const languageStatus = useLanguageStatus();

  return (
    <>
      <AppContext.Provider value={appStatus}>
        <BgMusicContext.Provider value={musicStatus}>
          <BgMusic props={{ audioPath: "" }} />
          <LanguageContext.Provider value={languageStatus}>
            <Layout>
              <Routes />
            </Layout>
          </LanguageContext.Provider>
        </BgMusicContext.Provider>
      </AppContext.Provider>
    </>
  );
}

export default App;
