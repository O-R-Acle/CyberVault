import { useEffect, useState } from "react";
import API_BASE_URL from "./api";

function DomainIntelligence({ onScanComplete }) {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState(null);
  const [scanHistory, setScanHistory]= useState(() => {
  return JSON.parse(
    localStorage.getItem("cybervault-domain-history") || "[]"
  );
});
useEffect(() => {
  const savedHistory = JSON.parse(
    localStorage.getItem("cybervault-domain-history") || "[]"
  );

  setScanHistory(savedHistory);
}, []);
  const [loading, setLoading] = useState(false);
  const clearScanHistory = () => {
  const confirmClear = window.confirm(
    "Are you sure you want to delete all domain scan history?"
  );

  if (!confirmClear) return;

  setScanHistory([]);
  localStorage.removeItem("cybervault-domain-history");
};

  const scanDomain = async () => {
    if (!domain.trim()) {
      setResult({ error: "Please enter a domain name." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/domain-intelligence`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ domain })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Domain scan failed.");
      }

      setResult(data);
      const updatedHistory = [
  {
    domain: data.domain,
    scannedAt: new Date().toLocaleString(),
    risk: data.dns?.status === "success" && data.ssl?.status === "valid"
      ? "Low Risk"
      : "Warning",
  },
  ...scanHistory,
].slice(0, 10);

setScanHistory(updatedHistory);

localStorage.setItem(
  "cybervault-domain-history",
  JSON.stringify(updatedHistory)
);
if (onScanComplete) {
  onScanComplete();
}
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  const expiryDate = result?.ssl?.expires
  ? new Date(result.ssl.expires)
  : null;

const daysUntilExpiry =
  expiryDate && !isNaN(expiryDate.getTime())
    ? Math.ceil(
        (expiryDate.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      )
    : null;

const certificateStatus =
  result?.ssl?.status !== "valid" || daysUntilExpiry === null
    ? "unavailable"
    : daysUntilExpiry < 0
    ? "expired"
    : daysUntilExpiry <= 30
    ? "expiring"
    : "valid";
    const domainRiskStatus =
  result?.dns?.status !== "success" ||
  certificateStatus === "expired"
    ? "Critical"
    : certificateStatus === "expiring" ||
      certificateStatus === "unavailable"
    ? "Warning"
    : "Low Risk";

    return (
    <section className="domain-intelligence" id="domain-intelligence">
      <p className="muted">DOMAIN THREAT INVESTIGATION</p>

      <h2>Domain Intelligence</h2>

      <p>
        Investigate domain information, DNS records and SSL certificates.
      </p>

      <input
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="Enter a domain (example.com)"
      />

      <button onClick={scanDomain} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Domain"}
      </button>

      {result?.error && <p>{result.error}</p>}
    {result && !result.error && (
  <div className="domain-result">
    <h3>Domain Analysis Results</h3>

<div className="domain-card">
  <h4>Overall Domain Risk Assessment</h4>

  <h2>
    {domainRiskStatus === "Low Risk" && "✓ Low Risk"}
    {domainRiskStatus === "Warning" && "⚠ Warning"}
    {domainRiskStatus === "Critical" && "✕ Critical Risk"}
  </h2>

  <p>
    {domainRiskStatus === "Low Risk" &&
      "DNS lookup succeeded and the SSL certificate is valid and not expiring within 30 days."}

    {domainRiskStatus === "Warning" &&
      "One or more domain security checks require attention."}

    {domainRiskStatus === "Critical" &&
      "A critical DNS or SSL certificate issue was detected."}
  </p>

  <div className="explainable-findings">
    <h4>Why did this domain receive this assessment?</h4>

    <div className="finding-item">
      <span className="finding-icon">🌐</span>
      <div>
        <strong>DNS Resolution</strong>
        <p>
          {result?.dns?.status === "success"
            ? "DNS lookup completed successfully. An IP address was found."
            : "DNS lookup was unsuccessful. The domain could not be resolved."}
        </p>
      </div>
    </div>

    <div className="finding-item">
      <span className="finding-icon">🔒</span>
      <div>
        <strong>SSL Certificate</strong>
        <p>
          {result?.ssl?.status === "valid"
            ? "The SSL certificate is valid according to the domain scan."
            : "The SSL certificate is invalid or unavailable. Check its status before trusting the connection."}
        </p>
      </div>
    </div>
  </div>

  <p>
    Assessment based only on DNS and SSL indicators. This is not a complete security verdict.
  </p>
</div>

    <div className="domain-card">
      <h4>Domain Information</h4>
      <p><strong>Domain:</strong> {result.domain}</p>
      <p><strong>IP Address:</strong> {result.dns.ip_address || "Unavailable"}</p>
      <p><strong>DNS Status:</strong> {result.dns.status}
      </p>
    </div>
    <p>
  <strong>IP Security:</strong>{" "}
  {result.dns.is_public
    ? "✓ Public IP Address"
    : "⚠ Non-Public IP Address"}
</p>

    <div className="domain-card">
  <h4>SSL Certificate</h4>

  <p>
    <strong>Status:</strong>{" "}
    {certificateStatus === "valid" && "✓ Valid"}
    {certificateStatus === "expiring" && "⚠ Expiring Soon"}
    {certificateStatus === "expired" && "✕ Expired"}
    {certificateStatus === "unavailable" && "⚠ Unavailable"}
  </p>

  <p>
    <strong>Expiry:</strong>{" "}
    {result.ssl.expires || "Unavailable"}
  </p>

  {daysUntilExpiry !== null && (
    <p>
      <strong>Days remaining:</strong>{" "}
      {daysUntilExpiry < 0
        ? "Certificate expired"
        : `${daysUntilExpiry} days`}
    </p>
  )}

  <p>
    <strong>Certificate Issuer:</strong>{" "}
    {result.ssl.issuer
      ? result.ssl.issuer.flat(3)
          .filter((item, index) => index % 2 === 1)
          .join(", ")
      : "Unavailable"}
  </p>

  {certificateStatus === "expiring" && (
    <p>⚠ Warning: This SSL certificate expires within 30 days.</p>
  )}

  {certificateStatus === "expired" && (
    <p>✕ Warning: This SSL certificate has expired.</p>
  )}

  {certificateStatus === "valid" && (
    <p>✓ Certificate is valid and not expiring within 30 days.</p>
  )}

  {certificateStatus === "unavailable" && (
    <p>SSL certificate validity could not be verified.</p>
  )}
</div>
  </div>
)}

    <section className="scanner">
      <h2>Domain Scan History</h2>
      <p className="muted">
        Your 10 most recent domain intelligence scans.
      </p>

      <button
  onClick={clearScanHistory}
  disabled={scanHistory.length === 0}
>
  Clear History
</button>

      {scanHistory.length === 0 ? (
        <p>No domain scans yet.</p>
      ) : (
        scanHistory.map((scan, index) => (
          <div key={index} className="history-item">
            <strong>{scan.domain}</strong>
            <p>{scan.risk}</p>
            <small>{scan.scannedAt}</small>
          </div>
        ))
      )}
    </section>

    </section>
  );
}

export default DomainIntelligence;