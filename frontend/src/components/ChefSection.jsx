import React, { useEffect, useState, useRef } from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, useScroll, useTransform } from "framer-motion";
import { backendUrl } from "../config";
const ChefSection = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/chefs`);
        const data = await res.json();
        setChefs(data);
      } catch (err) {
        console.error("Chefs fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChefs();
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth",
      });
    }
  };

  if (loading)
    return (
      <div
        style={{
          padding: "80px 0",
          textAlign: "center",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "1.4rem",
          color: "#f97316",
          letterSpacing: "0.1em",
        }}
      >
        Loading chefs…
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .chef-section {
          background: #fafaf8;
          padding: 100px 0 120px;
          position: relative;
          overflow: hidden;
        }

        /* decorative ruled lines behind heading */
        .chef-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 79px,
              rgba(249,115,22,0.06) 79px,
              rgba(249,115,22,0.06) 80px
            );
          pointer-events: none;
        }

        .chef-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 48px;
          position: relative;
        }

        /* ── HEADING ── */
        .chef-heading-wrap {
          display: flex;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: 64px;
        }
        .chef-heading-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #f97316;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          line-height: 1;
          padding-bottom: 4px;
        }
        .chef-heading-main {
          flex: 1;
        }
        .chef-heading-main h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 300;
          line-height: 1;
          color: #1c1c1a;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .chef-heading-main h2 em {
          font-style: italic;
          color: #f97316;
        }
        .chef-heading-rule {
          width: 80px;
          height: 1px;
          background: linear-gradient(90deg, #f97316, #fb923c, transparent);
          margin-bottom: 14px;
        }
        .chef-heading-main p {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #9ca3af;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .chef-count-badge {
          font-family: 'Cormorant Garamond', serif;
          font-size: 5rem;
          font-weight: 300;
          color: transparent;
          -webkit-text-stroke: 1px rgba(249,115,22,0.2);
          line-height: 1;
          user-select: none;
          letter-spacing: -0.04em;
        }

        /* ── SCROLL NAV ── */
        .chef-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #374151;
          transition: all 0.2s;
          font-size: 12px;
        }
        .chef-nav-btn:hover {
          background: #f97316;
          border-color: #f97316;
          color: #fff;
          transform: translateY(-50%) scale(1.05);
        }
        .chef-nav-btn.left { left: 0; }
        .chef-nav-btn.right { right: 0; }

        /* ── SCROLL TRACK ── */
        .chef-track {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 12px 4px 24px;
          scrollbar-width: none;
        }
        .chef-track::-webkit-scrollbar { display: none; }

        /* ── CARD ── */
        .chef-card {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: 240px;
          background: #fff;
          border: 1px solid #f1f0ec;
          border-radius: 2px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .chef-card:hover {
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          transform: translateY(-6px);
        }

        /* orange accent strip top */
        .chef-card::before {
          content: '';
          display: block;
          height: 3px;
          background: linear-gradient(90deg, #f97316, #fb923c);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s ease;
        }
        .chef-card:hover::before { transform: scaleX(1); }

        .chef-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background: #f9f5f0;
        }
        .chef-img-wrap img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
          filter: grayscale(20%);
        }
        .chef-card:hover .chef-img-wrap img {
          transform: scale(1.06);
          filter: grayscale(0%);
        }

        /* index number — top-right corner */
        .chef-index {
          position: absolute;
          top: 12px;
          right: 12px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 300;
          color: rgba(255,255,255,0.85);
          line-height: 1;
          pointer-events: none;
          text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .chef-body {
          padding: 20px 20px 16px;
        }
        .chef-specialty-tag {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #f97316;
          margin-bottom: 6px;
        }
        .chef-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem;
          font-weight: 600;
          color: #1c1c1a;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        /* divider */
        .chef-divider {
          height: 1px;
          background: #f1f0ec;
          margin-bottom: 14px;
        }

        /* social icons — subtle row */
        .chef-socials {
          display: flex;
          gap: 8px;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.25s, transform 0.25s;
        }
        .chef-card:hover .chef-socials {
          opacity: 1;
          transform: translateY(0);
        }
        .chef-social-link {
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 11px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .chef-social-link:hover {
          background: #f97316;
          border-color: #f97316;
          color: #fff;
          transform: scale(1.1);
        }
      `}</style>

      <section className="chef-section">
        <div className="chef-inner">

          {/* HEADING */}
          <div className="chef-heading-wrap">
            <span className="chef-heading-label">Culinary Team</span>
            <div className="chef-heading-main">
              <div className="chef-heading-rule" />
              <h2>Meet Our <em>Chefs</em></h2>
              <p>Passion & flavour — crafted by hand, served with pride</p>
            </div>
            {chefs.length > 0 && (
              <span className="chef-count-badge">0{chefs.length}</span>
            )}
          </div>

          {/* NAV BUTTONS */}
          <button className="chef-nav-btn left" onClick={() => scroll("left")} aria-label="Scroll left">
            <FaChevronLeft />
          </button>
          <button className="chef-nav-btn right" onClick={() => scroll("right")} aria-label="Scroll right">
            <FaChevronRight />
          </button>

          {/* CARDS */}
          <div ref={scrollRef} className="chef-track">
            {chefs.map((chef, i) => (
              <motion.div
                key={chef._id}
                className="chef-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                viewport={{ once: true, margin: "-40px" }}
              >
                <div className="chef-img-wrap">
                  <img src={chef.img} alt={chef.name} />
                  <span className="chef-index">0{i + 1}</span>
                </div>

                <div className="chef-body">
                  <p className="chef-specialty-tag">{chef.specialty}</p>
                  <h3 className="chef-name">{chef.name}</h3>
                  <div className="chef-divider" />
                  <div className="chef-socials">
                    <a href={chef.facebook} target="_blank" rel="noopener noreferrer" className="chef-social-link" aria-label="Facebook">
                      <FaFacebookF />
                    </a>
                    <a href={chef.instagram} target="_blank" rel="noopener noreferrer" className="chef-social-link" aria-label="Instagram">
                      <FaInstagram />
                    </a>
                    <a href={chef.twitter} target="_blank" rel="noopener noreferrer" className="chef-social-link" aria-label="Twitter">
                      <FaTwitter />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

export default ChefSection;
