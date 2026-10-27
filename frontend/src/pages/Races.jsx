import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Page, stagger } from "../components/Motion.jsx";
import RaceCard from "../components/RaceCard.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import useFetch from "../useFetch.js";
import { IMAGES } from "../site.js";
import Img from "../components/Img.jsx";

const tabs = [
  { id: "upcoming", label: "Upcoming races" },
  { id: "recent", label: "Recent races" },
];

export default function Races() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "recent" ? "recent" : "upcoming";
  const { data, loading, error } = useFetch(`/races?when=${tab}`);

  return (
    <Page>
      <section className="page-hero">
        <Img src={IMAGES.club[1]} alt="" className="page-hero-bg" />
        <div className="page-hero-overlay" />
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>Races</motion.h1>
          <p>Upcoming events you can enter, and recent races with results and photos.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`tab ${tab === t.id ? "is-active" : ""}`}
                onClick={() => setParams(t.id === "recent" ? { tab: "recent" } : {})}
              >
                {tab === t.id && <motion.span layoutId="tab-bg" className="tab-bg" />}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {loading ? (
                <RunnerLoader label={tab === "recent" ? "Loading recent races" : "Loading upcoming races"} />
              ) : error ? (
                <p className="alert alert-error">{error}</p>
              ) : data.races.length ? (
                <motion.div className="race-grid" variants={stagger} initial="hidden" animate="show">
                  {data.races.map((r) => <RaceCard key={r.id} race={r} />)}
                </motion.div>
              ) : (
                <div className="empty">
                  <p>{tab === "recent" ? "No past races yet." : "No upcoming races right now – new races will be posted soon."}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Page>
  );
}
