import { Link } from "react-router-dom";
import { Page } from "../components/Motion.jsx";

export default function NotFound({ title = "Wrong turn!", message = "This page ran off the course." }) {
  return (
    <Page>
      <div className="container section notfound">
        <h1>{title}</h1>
        <p className="muted">{message}</p>
        <Link to="/" className="btn btn-primary">Back to the start line</Link>
      </div>
    </Page>
  );
}
