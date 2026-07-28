import "../styles/Features.css";

function Features() {
  return (
    <section className="features">
      <h2 className="title">ALEX EAGLES</h2>

      <p className="subtitle">
        A multidisciplinary team of student engineers designing, building, and
        flying autonomous aircraft — driven by an unrelenting pursuit of
        precision in the skies.
      </p>

      <div className="features-content">
        <div className="features-image">
          <img src="/team.jpg" alt="team" />
        </div>

        <div className="features-text">
          <h3>Our Mission</h3>
          <p>
            Founded in 2020 at Alexandria University, Alex Eagles has grown from
            a handful of ambitious students into a competitive force in unmanned
            aerial systems. Every airframe, circuit, and line of flight-control
            code is designed, built, and tested in-house — engineered to perform
            when it matters most.
          </p>

          <p>
            Our mission is singular: to advance the frontier of autonomous
            flight, and to prove, mission after mission, that Egyptian student
            engineering belongs among the world's best.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Features;