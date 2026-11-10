
import { useState, useEffect } from "react";
import API_BASE_URL from "./api";
import "./App.css";

import QRShield from "./QRShield";
import MessageScanner from "./MessageScanner";
import DomainIntelligence from "./DomainIntelligence";
import Web3Verification from "./Web3Verification";

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

const loadScanHistory = (shouldScroll = true) => {
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

  if (shouldScroll) {
  document.getElementById("scan-history")?.scrollIntoView({
    behavior: "smooth",
  });
}
};
useEffect(() => {
  loadScanHistory(false);
}, []);

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

  setResult(null);
  setUrl("");
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
setCentralHistory((previous) => ({
  ...previous,
  urls: updatedScans,
}));

    } catch (error) {
      setResult({
        status: "Connection failed",
        details: [
          "Could not communicate with the CyberVault backend."
        ]
      });
    }
  }

  // CYBERVAULT SECURITY ANALYTICS

const totalScans =
  centralHistory.urls.length +
  centralHistory.qrs.length +
  centralHistory.domains.length +
  centralHistory.messages.length;

const highRiskCount =
  centralHistory.urls.filter(
    (scan) => Number(scan.riskScore) >= 60
  ).length +
  centralHistory.messages.filter(
    (scan) => Number(scan.score) >= 60
  ).length +
  centralHistory.domains.filter(
    (scan) => scan.risk === "Critical"
  ).length;

const suspiciousCount =
  centralHistory.urls.filter(
    (scan) => Number(scan.riskScore) >= 20 && Number(scan.riskScore) < 60
  ).length +
  centralHistory.messages.filter(
    (scan) => Number(scan.score) >= 20 && Number(scan.score) < 60
  ).length +
  centralHistory.domains.filter(
    (scan) => scan.risk === "Warning"
  ).length;

const lowRiskCount =
  centralHistory.urls.filter(
    (scan) => Number(scan.riskScore) < 20
  ).length +
  centralHistory.messages.filter(
    (scan) => Number(scan.score) < 20
  ).length +
  centralHistory.domains.filter(
    (scan) => scan.risk === "Low Risk"
  ).length;

const totalRiskAssessments =
  highRiskCount + suspiciousCount + lowRiskCount;
const securityScore =
  totalRiskAssessments > 0
    ? Math.round(
        (
          lowRiskCount * 100 +
          suspiciousCount * 50
        ) / totalRiskAssessments
      )
    : 0;

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
      document.getElementById("security-analytics")?.scrollIntoView({
        behavior: "smooth"
      })
    }
    style={{ cursor: "pointer" }}
  >
    ◈ Security Overview
  </p>

          <p
            onClick={() =>
              document.getElementById("scanner")?.scrollIntoView({
                behavior: "smooth",
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
                behavior: "smooth",
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

          <p
            onClick={() =>
              document.getElementById("web3-verification")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            style={{ cursor: "pointer" }}
          >
            ⬡ Web3 Verification
          </p>

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

        {/* LIVE SECURITY ANALYTICS */}

<section className="analytics" id="security-analytics">

  <p className="muted">SECURITY OVERVIEW</p>

  <h2>Live Security Analytics</h2>

  <p>
    An overview of your recorded security investigations.
  </p>

  <div className="analytics-grid">

    <div className="analytics-card">
      <span>Total Scans</span>
      <h2>{totalScans}</h2>
      <p>Across all security tools</p>
    </div>
    <div className="analytics-card security-score-card">
  <span>Security Assessment Score</span>

  <div
  className="security-score-circle"
  style={{
    "--score": `${securityScore}%`
  }}
>
    <div className="security-score-inner">
      <strong>{securityScore}</strong>
      <span>/ 100</span>
    </div>
  </div>

  <p>
    {securityScore >= 80
      ? "Good security posture"
      : securityScore >= 50
      ? "Moderate security posture"
      : "Needs security attention"}
  </p>
</div>

    <div className="analytics-card">
      <span>High Risk</span>
      <h2>{highRiskCount}</h2>
      <p>Critical risk indicators</p>
    </div>

    <div className="analytics-card">
      <span>Suspicious</span>
      <h2>{suspiciousCount}</h2>
      <p>Potential warning indicators</p>
    </div>

    <div className="analytics-card">
      <span>Low Risk</span>
      <h2>{lowRiskCount}</h2>
      <p>Low-risk assessments</p>
    </div>

  </div>

  <div className="analytics-card risk-distribution">

  <h3>Risk Distribution</h3>

  <p>
    High Risk: {highRiskCount} (
    {totalRiskAssessments
      ? ((highRiskCount / totalRiskAssessments) * 100).toFixed(1)
      : "0.0"}%)
  </p>

  <div className="risk-bar">
  <div
    className="risk-fill high"
    style={{
      width: `${totalRiskAssessments
        ? (highRiskCount / totalRiskAssessments) * 100
        : 0}%`
    }}
  />
  <span className="risk-bar-label">
    {totalRiskAssessments
      ? ((highRiskCount / totalRiskAssessments) * 100).toFixed(1) + "%"
      : "0.0%"}
  </span>
</div>
  <p>
    Suspicious: {suspiciousCount} (
    {totalRiskAssessments
      ? ((suspiciousCount / totalRiskAssessments) * 100).toFixed(1)
      : "0.0"}%)
  </p>

  <div className="risk-bar">
  <div
    className="risk-fill suspicious"
    style={{
      width: `${totalRiskAssessments
        ? (suspiciousCount / totalRiskAssessments) * 100
        : 0}%`
    }}
  />
  <span className="risk-bar-label">
    {totalRiskAssessments
      ? ((suspiciousCount / totalRiskAssessments) * 100).toFixed(1) + "%"
      : "0.0%"}
  </span>
</div>

  <p>
    Low Risk: {lowRiskCount} (
    {totalRiskAssessments
      ? ((lowRiskCount / totalRiskAssessments) * 100).toFixed(1)
      : "0.0"}%)
  </p>

  <div className="risk-bar">
  <div
    className="risk-fill low"
    style={{
      width: `${totalRiskAssessments
        ? (lowRiskCount / totalRiskAssessments) * 100
        : 0}%`
    }}
  />
  <span className="risk-bar-label">
    {totalRiskAssessments
      ? ((lowRiskCount / totalRiskAssessments) * 100).toFixed(1) + "%"
      : "0.0%"}
  </span>
</div>

{totalRiskAssessments >= 0 && (
  <>
    <div className="risk-donut-layout">
      <div
        className="risk-donut"
        style={{
  background: totalRiskAssessments > 0
    ? `conic-gradient(
        #ef4444 0% ${(highRiskCount / totalRiskAssessments) * 100}%,
        #f59e0b ${(highRiskCount / totalRiskAssessments) * 100}% ${((highRiskCount + suspiciousCount) / totalRiskAssessments) * 100}%,
        #22c55e ${((highRiskCount + suspiciousCount) / totalRiskAssessments) * 100}% 100%
      )`
    : "#263449"
}}
      >
        <div className="risk-donut-hole">
          <strong>{totalRiskAssessments}</strong>
          <span>Assessments</span>
        </div>
      </div>
    </div>
    <div className="risk-donut-legend">
      <p><span className="legend-dot high-dot"></span> High Risk</p>
      <p><span className="legend-dot suspicious-dot"></span> Suspicious</p>
      <p><span className="legend-dot low-dot"></span> Low Risk</p>
    </div>
  </>
)}

  {totalRiskAssessments === 0 && (
    <p>No risk assessments recorded yet.</p>
  )}

</div>
  <p className="muted">
    QR scans are included in total scans but excluded from risk distribution
    because QR history does not store a risk score.
  </p>

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
          <button type="button" onClick={clearURLHistory}>
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

              {/* EXPLAINABLE SECURITY FINDINGS */}

<div className="explainable-findings">

  <h3>Why was this URL flagged?</h3>

  {result.details?.length > 0 ? (
    result.details.map((item, index) => (
      <div className="finding-item" key={index}>
        <span className="finding-icon">⚠</span>
        <div>
          <strong>
  {item.toLowerCase().includes("https")
    ? "Connection Security"
    : item.toLowerCase().includes("hyphen")
    ? "Domain Structure"
    : item.toLowerCase().includes("keyword")
    ? "Suspicious Keywords"
    : `Security Indicator ${index + 1}`}
</strong>
          <p>{item}</p>
        </div>
      </div>
    ))
  ) : (
    <div className="finding-item">
      <span className="finding-icon">✓</span>
      <div>
        <strong>No suspicious indicators detected</strong>
        <p>
          The basic local checks did not identify any warning signs.
        </p>
      </div>
    </div>
  )}

</div>

              <p className="result-note">
                This is a basic local URL check, not a complete
                security scan or proof that a website is safe.
              </p>

            </div>
          )}

        </section>

        {/* QR SHIELD */}

        <QRShield
  onScanComplete={() => loadScanHistory(false)}
/>

        {/* MESSAGE SCANNER */}

        <MessageScanner
  onScanComplete={() => loadScanHistory(false)}
/>

        {/* DOMAIN INTELLIGENCE */}

        <DomainIntelligence
  onScanComplete={() => loadScanHistory(false)}
/>
        <Web3Verification />


{/* RECENT SECURITY ACTIVITY */}

<section className="scanner" id="recent-activity">
  <h2>Recent Security Activity</h2>

  <p className="muted">
    Your latest security investigations across CyberVault.
  </p>

  {[
    ...centralHistory.urls.map((item) => ({
      type: "URL Scan",
      name: item.url,
      risk: Number(item.riskScore) >= 60
        ? "High Risk"
        : Number(item.riskScore) >= 20
        ? "Suspicious"
        : "Low Risk",
      time: item.scannedAt,
    })),
    ...centralHistory.qrs.map((item) => ({
      type: "QR Scan",
      name: item.content,
      risk: "Not assessed",
      time: item.scannedAt,
    })),
    ...centralHistory.messages.map((item) => ({
      type: "Message Scan",
      name: item.message,
      risk: Number(item.score) >= 60
        ? "High Risk"
        : Number(item.score) >= 20
        ? "Suspicious"
        : "Low Risk",
      time: item.timestamp,
    })),
    ...centralHistory.domains.map((item) => ({
      type: "Domain Scan",
      name: item.domain,
      risk: item.risk,
      time: item.scannedAt,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5)
    .map((item, index) => (
      <div className="history-item" key={index}>
        <strong>{item.type}</strong>
        <p>{item.name}</p>
        <p>Risk: {item.risk}</p>
        <small>{item.time}</small>
      </div>
    ))}

  {totalScans === 0 && (
    <p>No recent security activity yet.</p>
  )}
</section>


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
