
import { useState } from "react";
import API_BASE_URL from "./api";
import "./App.css";

import QRShield from "./QRShield";
import MessageScanner from "./MessageScanner";
import DomainIntelligence from "./DomainIntelligence";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [apiStatus, setApiStatus] = useState("Not connected");
  const [centralHistory, setCentralHistory] = useState({
  urls: [],
  qrs: [],
  domains: [],
  messages: []
});

const loadScanHistory = () => {
  const readHistory = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  setCentralHistory({
    urls: readHistory("cybervault-url-history"),
    qrs: readHistory("cybervault-qr-history"),
    domains: readHistory("cybervault-domain-history"),
    messages: readHistory("cybervault-message-history"),
  });

  document.getElementById("scan-history")?.scrollIntoView({
    behavior: "smooth",
  });
};

const clearURLHistory = () => {
  const confirmClear = window.confirm(
    "Are you sure you want to delete all URL scan history?"
  );

  if (!confirmClear) return;

  localStorage.removeItem("cybervault-url-history");

  setCentralHistory((previous) => ({
    ...previous,
    urls: [],
  }));
};
  const testBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setApiStatus(data.status);
    } catch (error) {
      setApiStatus("Connection failed");
    }
  };
  async function scanURL()
   {
    setResult(null);

    if (!url.trim()) {
      setResult({
        status: "Invalid input",
        details: ["Please enter a website URL."]
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/scan-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: url.trim() })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Scanner request failed");
      }

      setResult({
        status: data.status,
        details: data.findings,
        riskScore: data.risk_score,
        urlhaus: data.urlhaus
      });
      const previousScans = JSON.parse(
  localStorage.getItem("cybervault-url-history") || "[]"
);

const updatedScans = [
  {
    url: url.trim(),
    status: data.status,
    riskScore: data.risk_score,
    urlhausStatus: data.urlhaus?.status || "unavailable",
    scannedAt: new Date().toLocaleString(),
  },
  ...previousScans,
].slice(0, 10);

localStorage.setItem(
  "cybervault-url-history",
  JSON.stringify(updatedScans)
);

    } catch (error) {
      setResult({
        status: "Connection failed",
        details: [
          "Could not communicate with the CyberVault backend."
        ]
      });
    }
  }

  return (
    <div className="app">

      <aside className="sidebar">

        <h2>🔐 CyberVault</h2>

        <p className="tagline">
          Uncover threats. Protect trust.
        </p>

        {/* SIDEBAR NAVIGATION */}

        <nav>
          <p
  onClick={() =>
    document.getElementById("scanner")?.scrollIntoView({
      behavior: "smooth"
    })
  }
  style={{ cursor: "pointer" }}
>
  ◎ URL Security Scanner
</p>
          <p
            onClick={() =>
              document.getElementById("qr-shield")?.scrollIntoView({
                behavior: "smooth"
              })
            }
            style={{ cursor: "pointer" }}
          >
            ▦ QR Shield
          </p>

          <p
            onClick={() =>
              document.getElementById("message-scanner")?.scrollIntoView({
                behavior: "smooth"
              })
            }
            style={{ cursor: "pointer" }}
          >
            ✉ Message Scanner
          </p>

          <p
            onClick={() =>
              document.getElementById("domain-intelligence")?.scrollIntoView({
                behavior: "smooth"
              })
            }
            style={{ cursor: "pointer" }}
          >
            ◎ Domain Intelligence
          </p>

          <p>⬡ Web3 Verification</p>

          <p
  onClick={loadScanHistory}
  style={{ cursor: "pointer" }}
>
  ◷ Scan History
</p>

        </nav>

        <div className="sidebar-bottom">
          <p>CyberVault v1.0</p>
          <p>AI + Cybersecurity + Web3</p>
        </div>

      </aside>

      <main className="main">

        {/* HEADER */}

        <header>

          <div>
            <p className="muted">
              SECURITY COMMAND CENTRE
            </p>

            <h1>Welcome to CyberVault</h1>
          </div>

          <span className="status">
            ● SYSTEM ONLINE
          </span>

        </header>

        {/* BACKEND CONNECTION */}

        <section className="scan-card">

          <h2>Backend Connection</h2>

          <button onClick={testBackend}>
            Test Backend Connection
          </button>

          <p>Backend Status: {apiStatus}</p>

        </section>

        {/* HERO SECTION */}

        <section className="hero">

          <p className="muted">
            YOUR DIGITAL SECURITY STARTS HERE
          </p>

          <h2>See beyond the link.</h2>

          <p>
            Investigate suspicious websites, QR codes, emails
            and messages with intelligent threat analysis.
          </p>

          <button
            onClick={() =>
              document.getElementById("scanner")?.scrollIntoView({
                behavior: "smooth"
              })
            }
          >
            Start Investigation →
          </button>

        </section>

        {/* DASHBOARD STATS */}

        <section className="stats">

          <div className="stat">
            <span>01</span>
            <h3>URL Intelligence</h3>
            <p>Investigate suspicious links</p>
          </div>

          <div className="stat">
            <span>02</span>
            <h3>QR Shield</h3>
            <p>Inspect suspicious QR codes</p>
          </div>

          <div className="stat">
            <span>03</span>
            <h3>AI Scam Detection</h3>
            <p>Analyse suspicious messages</p>
          </div>

          <div className="stat">
            <span>04</span>
            <h3>Web3 Verification</h3>
            <p>Verify report integrity</p>
          </div>

        </section>

        {/* URL SCANNER */}

        <section className="scanner" id="scanner">

          <p className="muted">
            THREAT INVESTIGATION
          </p>

          <h2>URL Security Scanner</h2>

          <p>
            Enter a website address for a preliminary URL check.
          </p>

          <input
            className="url-input"
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />

          <button onClick={scanURL}>
            Analyse URL →
          </button>
          <button onClick={clearURLHistory}>
  Clear URL History
</button>

          {result && (

            <div className="scan-result">

              <h3>{result.status}</h3>

              {result.riskScore !== undefined && (
                <>
                  <p>
                    Risk Score: {result.riskScore}/100
                  </p>

                  <div className="risk-meter">

                    <div className="risk-meter-track">

                      <div
                        className="risk-meter-fill"
                        style={{
                          width: `${result.riskScore}%`
                        }}
                      ></div>

                    </div>

                    <p>
                      {result.riskScore <= 20
                        ? "Low Risk"
                        : result.riskScore <= 40
                        ? "Moderate Risk"
                        : result.riskScore <= 70
                        ? "High Risk"
                        : "Critical Risk"}
                    </p>

                  </div>
                </>
              )}

              {/* URLHAUS RESULTS */}

              {result.urlhaus && (
                <div className="urlhaus-result">

                  <h4>URLhaus Threat Intelligence</h4>

                  {result.urlhaus.status === "listed" && (
                    <>
                      <h3>⚠️ Threat Listed</h3>

                      <p>
                        This URL appears in the URLhaus malware database.
                      </p>

                      <p>
                        URL Status: {result.urlhaus.url_status || "Unknown"}
                      </p>

                      {result.urlhaus.reference && (
                        <p>
                          Reference:{" "}
                          <a
                            href={result.urlhaus.reference}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View URLhaus Report
                          </a>
                        </p>
                      )}
                    </>
                  )}

                  {result.urlhaus.status === "not_listed" && (
                    <>
                      <h3>✓ No Record Found</h3>
                      <p>
                        No matching malware URL record was found in URLhaus.
                      </p>
                    </>
                  )}

                  {result.urlhaus.status === "unavailable" && (
                    <>
                      <h3>Service Unavailable</h3>
                      <p>
                        URLhaus could not be reached. Please try again later.
                      </p>
                    </>
                  )}

                  {result.urlhaus.status === "not_configured" && (
                    <>
                      <h3>Not Configured</h3>
                      <p>
                        URLhaus API credentials are missing.
                      </p>
                    </>
                  )}

                  {result.urlhaus.status === "not_checked" && (
                    <>
                      <h3>Not Checked</h3>
                      <p>
                        The URL was invalid, so no database lookup was performed.
                      </p>
                    </>
                  )}

                </div>
              )}

              {/* SCANNER FINDINGS */}

              {result.details?.map((item, index) => (
                <p key={index}>• {item}</p>
              ))}

              <p className="result-note">
                This is a basic local URL check, not a complete
                security scan or proof that a website is safe.
              </p>

            </div>
          )}

        </section>

        {/* QR SHIELD */}

        <QRShield />

        {/* MESSAGE SCANNER */}

        <MessageScanner />

        {/* DOMAIN INTELLIGENCE */}

        <DomainIntelligence />

        {/* CENTRAL SCAN HISTORY */}

<section className="scanner" id="scan-history">
  <h2>Scan History</h2>

  <p className="muted">
    Your previous CyberVault security investigations.
  </p>

<h3>URL Scanner Scans</h3>
{centralHistory.urls.length === 0 ? (
  <p>No URL scans available.</p>
) : (
  centralHistory.urls.map((item, index) => (
    <div className="history-item" key={`url-${index}`}>
      <strong>{item.url}</strong>
      <p>{item.status}</p>
      <p>Risk Score: {item.riskScore}/100</p>
      <p>URLhaus: {item.urlhausStatus}</p>
      <small>{item.scannedAt}</small>
    </div>
  ))
)}
  <h3>QR Shield Scans</h3>

{centralHistory.qrs.length === 0 ? (
  <p>No QR scans available.</p>
) : (
  centralHistory.qrs.map((item, index) => (
    <div className="history-item" key={`qr-${index}`}>
      <strong>{item.type} QR Code</strong>
      <p>{item.content}</p>
      <small>{item.scannedAt}</small>
    </div>
  ))
)}
  <h3>Domain Intelligence Scans</h3>

  {centralHistory.domains.length === 0 ? (
    <p>No domain scans available.</p>
  ) : (
    centralHistory.domains.map((item, index) => (
      <div className="history-item" key={`domain-${index}`}>
        <strong>{item.domain}</strong>
        <p>{item.risk}</p>
        <small>{item.scannedAt}</small>
      </div>
    ))
  )}

  <h3>Message Scans</h3>

  {centralHistory.messages.length === 0 ? (
    <p>No message scans available.</p>
  ) : (
    centralHistory.messages.map((item, index) => (
      <div className="history-item" key={`message-${index}`}>
        <strong>{item.status}</strong>
        <p>Risk Score: {item.score}/100</p>
        <p>{item.message.slice(0, 100)}</p>
        <small>{item.timestamp}</small>
      </div>
    ))
  )}
</section>

        {/* FOOTER */}

        <footer>
          CYBERVAULT © 2026 · INTELLIGENT DIGITAL SECURITY
        </footer>

      </main>

    </div>
  );
}

export default App;
