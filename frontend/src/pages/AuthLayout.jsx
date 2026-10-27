import { motion } from "framer-motion";
import { Page } from "../components/Motion.jsx";
import Img from "../components/Img.jsx";
import Logo from "../components/Logo.jsx";
import { IMAGES } from "../site.js";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Page className="auth-page">
      <div className="auth-grid">
        <div className="auth-art">
          <Img src={IMAGES.auth} alt="" />
          <div className="auth-art-overlay" />
          <div className="auth-art-text">
            <h2>Every finish line starts with a <span className="red">first step.</span></h2>          </div>
        </div>
        <motion.div className="auth-form-wrap" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="auth-form">
            <Logo />
            <h1>{title}</h1>
            <p className="muted">{subtitle}</p>
            {children}
          </div>
        </motion.div>
      </div>
    </Page>
  );
}
