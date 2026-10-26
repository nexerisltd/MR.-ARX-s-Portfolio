import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="nf">
      <p className="label"><span>404</span>Page not found</p>
      <h1 className="nf-big">Lost<em>.</em></h1>
      <p className="lead">The page you're looking for doesn't exist — or it moved.</p>
      <div className="row"><Link to="/" className="btn btn-solid">Back home</Link><Link to="/projects" className="btn">See projects</Link></div>
    </section>
  );
}
