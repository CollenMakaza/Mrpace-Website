import { useState } from "react";
import { Link } from "react-router-dom";
import { IMAGES } from "../site.js";

// Shows the club logo image, or a text logo if the image is missing.
export default function Logo({ size = "md", link = true, showText = false }) {
  const [failed, setFailed] = useState(false);
  const content = (
    <span className={`logo logo-${size}`}>
      {!failed && <img src={IMAGES.logo} alt="Mr Pace logo" onError={() => setFailed(true)} />}
      {(failed || showText) && (
        <span className="logo-text">
          MR <b>PACE</b>
        </span>
      )}
    </span>
  );
  return link ? (
    <Link to="/" className="logo-link" aria-label="Mr Pace home">
      {content}
    </Link>
  ) : (
    content
  );
}
