
import '../App.css';

function App() {
  const features = [
    {
      icon: "📍",
      title: "Location-Based Reporting",
      description:
        "Report civic problems from your area with accurate location details.",
    },
    {
      icon: "📸",
      title: "Photo Evidence",
      description:
        "Upload photos of civic issues to help authorities understand the problem.",
    },
    {
      icon: "📊",
      title: "Track Progress",
      description:
        "Follow your complaints and stay updated on their progress.",
    },
    {
      icon: "🤝",
      title: "Community Impact",
      description:
        "Work together with citizens to make your neighbourhood better.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create an account",
      description: "Register as a citizen and access your personal dashboard.",
    },
    {
      number: "02",
      title: "Report an issue",
      description: "Select the category, add a description, photo and location.",
    },
    {
      number: "03",
      title: "Track the progress",
      description: "Monitor your complaint as the concerned authority reviews it.",
    },
  ];

  return (
    <div className="app">
      <nav className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon">C</span>
          <span>Civi<span>Synq</span></span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <a href="#login" className="login-link">Log in</a>
          <a href="#report" className="nav-button">Get Started <span>↗</span></a>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="live-dot"></span>
              SMARTER CITIES START WITH US
            </div>

            <h1>
              Your city deserves
              <br />
              <span>a better voice.</span>
            </h1>

            <p className="hero-description">
              A smarter way to report civic issues, connect with your
              community, and help build a cleaner, safer and better
              Hubballi-Dharwad.
            </p>

            <div className="hero-actions">
              <a href="#report" className="primary-button">
                Report an issue <span>↗</span>
              </a>
              <a href="#how-it-works" className="secondary-button">
                Discover how it works <span>→</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="avatar-stack">
                <span>👤</span>
                <span>👤</span>
                <span>👤</span>
              </span>
              <p><strong>One community.</strong> One better city.</p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="dashboard-card">
              <div className="dashboard-top">
                <div>
                  <span className="dashboard-label">CITIZEN DASHBOARD</span>
                  <h3>City Overview</h3>
                </div>
                <span className="dashboard-menu">•••</span>
              </div>

              <div className="welcome-panel">
                <div>
                  <span>Welcome to CiviSynq</span>
                  <h3>Make your city better.</h3>
                  <p>Your voice can make a difference.</p>
                </div>
                <div className="welcome-icon">🏙️</div>
              </div>

              <div className="stat-grid">
                <div className="stat-box">
                  <span className="stat-icon purple">📋</span>
                  <p>Total Reports</p>
                  <h2>128</h2>
                  <small>Community reports</small>
                </div>
                <div className="stat-box">
                  <span className="stat-icon green">✓</span>
                  <p>Resolved</p>
                  <h2>86</h2>
                  <small>Issues completed</small>
                </div>
              </div>

              <div className="recent-section">
                <div className="recent-heading">
                  <h4>Recent activity</h4>
                  <span>View all →</span>
                </div>

                <div className="activity-row">
                  <span className="activity-icon road">🛣️</span>
                  <div className="activity-info">
                    <strong>Road damage</strong>
                    <small>Vidyanagar, Hubballi</small>
                  </div>
                  <span className="status pending">Pending</span>
                </div>

                <div className="activity-row">
                  <span className="activity-icon water">💧</span>
                  <div className="activity-info">
                    <strong>Water leakage</strong>
                    <small>Deshpande Nagar</small>
                  </div>
                  <span className="status progress">In progress</span>
                </div>

                <div className="activity-row">
                  <span className="activity-icon clean">♻️</span>
                  <div className="activity-info">
                    <strong>Garbage collection</strong>
                    <small>Keshwapur, Hubballi</small>
                  </div>
                  <span className="status resolved">Resolved</span>
                </div>
              </div>

              <div className="dashboard-bottom">
                <span>● Your community matters</span>
                <span>Powered by CiviSynq</span>
              </div>
            </div>

            <div className="floating-card">
              <span className="floating-check">✓</span>
              <div>
                <strong>Every report counts</strong>
                <small>Be part of the change</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <p>BUILT FOR BETTER COMMUNITIES</p>
          <div>
            <span>🏙️ Hubballi</span>
            <span>•</span>
            <span>🌆 Dharwad</span>
            <span>•</span>
            <span>🤝 Every Citizen</span>
          </div>
        </section>

        <section className="features-section section" id="features">
          <div className="section-heading">
            <span className="section-tag">WHAT WE OFFER</span>
            <h2>Small actions. <span>Big changes.</span></h2>
            <p>
              CiviSynq makes it easier for citizens and authorities to work
              together towards a better urban environment.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="how-section section" id="how-it-works">
          <div className="how-intro">
            <span className="section-tag">SIMPLE PROCESS</span>
            <h2>Making a difference is <span>easier than ever.</span></h2>
            <p>
              Three simple steps to turn your concerns into meaningful
              community action.
            </p>
            <a href="#report" className="primary-button">
              Get started <span>↗</span>
            </a>
          </div>

          <div className="steps-list">
            {steps.map((step) => (
              <div className="step-item" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <span className="step-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section" id="report">
          <div>
            <span className="section-tag">YOUR CITY. YOUR RESPONSIBILITY.</span>
            <h2>Let's build a better city, together.</h2>
            <p>
              Your voice matters. Take the first step towards improving
              your neighbourhood.
            </p>
          </div>
          <a href="/login" className="cta-button">
            Join CiviSynq <span>↗</span>
          </a>
        </section>

        <section className="about-section section" id="about">
          <div>
            <span className="section-tag">ABOUT CIVISYNQ</span>
            <h2>Technology with a <span>purpose.</span></h2>
          </div>
          <p>
            CiviSynq is a smart-city civic issue reporting platform designed
            to connect citizens with the process of improving their city.
            By making reporting and tracking more accessible, we aim to
            encourage community participation and accountability.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a href="#home" className="brand">
          <span className="brand-icon">C</span>
          <span>Civi<span>Synq</span></span>
        </a>
        <p>Building better communities, one report at a time.</p>
        <span>© 2026 CiviSynq. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default App;
