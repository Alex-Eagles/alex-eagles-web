import { Link } from "react-router-dom";
import "../styles/Updates.css";

export default function Updates() {
  return (
    <section className="updates">
      <h2 className="updates-title">Latest Achievements</h2>

      <div className="updates-canvas">
        <div className="updates-list">
          <div className="update-item">
            <h3 className="update-item-title">🏆 5th Place - Overall UAVC</h3>
            <div className="update-item-footer">
              <span className="update-item-date">March 10, 2025</span>
            </div>
          </div>

          <div className="update-item">
            <h3 className="update-item-title">
              🏆 Best Technical Design Report UAVC
            </h3>
            <div className="update-item-footer">
              <span className="update-item-date">March 5, 2025</span>
            </div>
          </div>

          <div className="update-item">
            <h3 className="update-item-title">
              🏆 Best Technical Design Report SUAS
            </h3>
            <div className="update-item-footer">
              <span className="update-item-date">February 28, 2025</span>
            </div>
          </div>
        </div>
      </div>

      <Link to="/history" className="updates-cta">
        Know Us →
      </Link>
    </section>
  );
}
