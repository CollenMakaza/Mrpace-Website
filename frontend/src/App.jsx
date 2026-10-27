import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RunnerLoader from "./components/RunnerLoader.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useAuth } from "./AuthContext.jsx";

const pages = {
  Home: () => import("./pages/Home.jsx"),
  Races: () => import("./pages/Races.jsx"),
  RaceDetail: () => import("./pages/RaceDetail.jsx"),
  RaceRegister: () => import("./pages/RaceRegister.jsx"),
  MyRaces: () => import("./pages/MyRaces.jsx"),
  Register: () => import("./pages/Register.jsx"),
  Gallery: () => import("./pages/Gallery.jsx"),
  About: () => import("./pages/About.jsx"),
  Login: () => import("./pages/Login.jsx"),
  Signup: () => import("./pages/Signup.jsx"),
  NotFound: () => import("./pages/NotFound.jsx"),
};
const Home = lazy(pages.Home);
const Races = lazy(pages.Races);
const RaceDetail = lazy(pages.RaceDetail);
const RaceRegister = lazy(pages.RaceRegister);
const MyRaces = lazy(pages.MyRaces);
const Register = lazy(pages.Register);
const Gallery = lazy(pages.Gallery);
const About = lazy(pages.About);
const Login = lazy(pages.Login);
const Signup = lazy(pages.Signup);
const NotFound = lazy(pages.NotFound);

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="page-loader">
      <RunnerLoader label="Loading page" />
    </div>
  );
}

export default function App() {
  const { ready } = useAuth();
  const location = useLocation();
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashDone, setSplashDone] = useState(false);

  // First-visit splash: the runner races to the finish while the app starts.
  useEffect(() => {
    const t = setInterval(() => setSplashProgress((p) => Math.min(ready ? 100 : 88, p + (ready ? 9 : 4))), 60);
    return () => clearInterval(t);
  }, [ready]);

  useEffect(() => {
    if (splashProgress >= 100) {
      const t = setTimeout(() => setSplashDone(true), 350);
      return () => clearTimeout(t);
    }
  }, [splashProgress]);

  // Once the site is open, quietly download every page so later clicks don't wait.
  useEffect(() => {
    if (splashDone) Object.values(pages).forEach((load) => load().catch(() => {}));
  }, [splashDone]);

  // Every page change shows the loading screen first. The old page stays put
  // underneath until the loading screen covers it, then the new page is swapped in.
  const [shownLocation, setShownLocation] = useState(location);
  const [routeProgress, setRouteProgress] = useState(null);
  const changingPage = location.pathname !== shownLocation.pathname;
  useEffect(() => {
    if (location.pathname === shownLocation.pathname) {
      // Same page (e.g. only ?tab= changed): just update it, no loading screen.
      setShownLocation(location);
      setRouteProgress(null);
      return;
    }
    let p = 0;
    let hide;
    setRouteProgress(0);
    const t = setInterval(() => {
      p = Math.min(100, p + 8);
      setRouteProgress(p);
      if (p >= 40) {
        window.scrollTo({ top: 0, behavior: "instant" });
        setShownLocation(location);
      }
      if (p >= 100) {
        clearInterval(t);
        hide = setTimeout(() => setRouteProgress(null), 250);
      }
    }, 60);
    return () => {
      clearInterval(t);
      clearTimeout(hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  const showRouteLoader = routeProgress !== null || changingPage;

  return (
    <>
      <AnimatePresence>
        {!splashDone && <RunnerLoader key="splash" fullScreen label="Warming up" progress={splashProgress} />}
        {splashDone && showRouteLoader && <RunnerLoader key="route" fullScreen label="Loading" progress={routeProgress ?? 0} />}
      </AnimatePresence>

      {ready && (
        <>
          <Navbar />
          {/* The loading screen covers page changes, so pages swap instantly underneath
              (no exit animation to wait on, which could leave the page blank). */}
          <ErrorBoundary key={shownLocation.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes location={shownLocation} key={shownLocation.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/races" element={<Races />} />
                <Route path="/races/:id" element={<RaceDetail />} />
                <Route path="/races/:id/register" element={<RequireAuth><RaceRegister /></RequireAuth>} />
                <Route path="/my-races" element={<RequireAuth><MyRaces /></RequireAuth>} />
                <Route path="/register" element={<Register />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Footer />
        </>
      )}
    </>
  );
}
