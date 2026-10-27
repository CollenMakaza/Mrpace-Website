import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import RunnerLoader from "./components/RunnerLoader.jsx";
import Layout from "./components/Layout.jsx";
import { useAdmin } from "./AdminAuth.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Races = lazy(() => import("./pages/Races.jsx"));
const Registrations = lazy(() => import("./pages/Registrations.jsx"));
const CheckIn = lazy(() => import("./pages/CheckIn.jsx"));
const Gallery = lazy(() => import("./pages/Gallery.jsx"));
const Runners = lazy(() => import("./pages/Runners.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));

const PageLoader = () => <div className="page-loader"><RunnerLoader label="Loading" /></div>;

export default function App() {
  const { admin, ready } = useAdmin();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(ready ? 100 : 88, p + (ready ? 10 : 4))), 50);
    return () => clearInterval(t);
  }, [ready]);
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setSplashDone(true), 300);
      return () => clearTimeout(t);
    }
  }, [progress]);

  return (
    <>
      <AnimatePresence>
        {!splashDone && <RunnerLoader key="splash" fullScreen label="Opening admin" progress={progress} />}
      </AnimatePresence>

      {ready && (
        <Suspense fallback={<PageLoader />}>
          {!admin ? (
            <Routes>
              <Route path="*" element={<Login />} />
            </Routes>
          ) : (
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/races" element={<Races />} />
                    <Route path="/registrations" element={<Registrations />} />
                    <Route path="/check-in" element={<CheckIn />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/runners" element={<Runners />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </Layout>
          )}
        </Suspense>
      )}
    </>
  );
}
