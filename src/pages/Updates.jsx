import "../styles/Updates.css";

export default function Updates() {
  return (
    <section className="updates">
      <h2 className="updates-title">Latest Achievements</h2>

      <div className="updates-list">
        <div className="update-item">
          <span className="update-badge">March 10, 2025</span>
          <h3>🏆 5th Place - Overall UAVC</h3>
        </div>

        <div className="update-item">
          <span className="update-badge">March 5, 2025</span>
          <h3>🏆 Best Technical Design Report UAVC</h3>
        </div>

        <div className="update-item">
          <span className="update-badge">February 28, 2025</span>
          <h3>🏆 Best Technical Design Report SUAS</h3>
        </div>
      </div>
    </section>
  );
}
