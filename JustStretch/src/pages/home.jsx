import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <section className="home-page">
        <h1>
          JustStretch: Computer Vision Skeletal Tracking for Guided Physical
          Rehabilitation.
        </h1>
        <p className="home-intro">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio facere
          laborum hic minima. Dolorem expedita beatae optio in adipisci nisi
          temporibus consectetur, voluptate delectus praesentium? Neque, facilis
          nesciunt? Error, molestiae.
        </p>
        <Link className="cta" to="/session">
          Start Session &rarr;
        </Link>
      </section>
    </div>
  );
}
