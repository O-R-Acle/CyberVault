import React, { useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import API_BASE_URL from "./api";

function QRShield({ onScanComplete }) {
  const [qrResult, setQrResult] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const scanQR = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setLoading(true);
    setMessage("Analyzing QR code...");
    setQrResult("");

    const scanner = new Html5Qrcode("qr-reader");

    try {
      const decodedText = await scanner.scanFile(file, true);

      setQrResult(decodedText);
      let previousScans = [];

try {
  previousScans = JSON.parse(
    localStorage.getItem("cybervault-qr-history") || "[]"
  );
} catch {
  previousScans = [];
}

const updatedScans = [
  {
    content: decodedText,
    type: decodedText.startsWith("http") ? "URL" : "Text",
    scannedAt: new Date().toLocaleString(),
  },
  ...previousScans,
].slice(0, 10);

localStorage.setItem(
  "cybervault-qr-history",
  JSON.stringify(updatedScans)
);
if (onScanComplete) {
  onScanComplete();
}
      setMessage("QR code successfully decoded!");
    } catch (error) {
      setMessage("Unable to read QR code. Try another image.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

    const clearQRHistory = () => {
  const confirmClear = window.confirm(
    "Are you sure you want to delete all QR scan history?"
  );

  if (!confirmClear) return;

  localStorage.removeItem("cybervault-qr-history");

  setQrResult("");
  setMessage("");
  setLoading(false);
};

  return (
    <section className="qr-shield" id="qr-shield">
      <p className="muted">QR THREAT INVESTIGATION</p>

      <h2>QR Shield</h2>

      <p>
        Upload a QR code image to extract and inspect its contents.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={scanQR}
      />
      <button onClick={clearQRHistory}>
  Clear QR History
</button>

      <div id="qr-reader"></div>

      {loading && <p>{message}</p>}

{!loading && message && (
  <div className="qr-message">
    {message.split("\n").map((line, index) => (
      <p key={index}>{line}</p>
    ))}
  </div>
)}
      {qrResult && (
  <div className="qr-result">
    <h3>Decoded QR Content</h3>
    <p>{qrResult}</p>

    {qrResult.startsWith("http://") ||
    qrResult.startsWith("https://") ? (
      <button
        onClick={async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/scan-qr-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: qrResult }),
      }
    );

    const data = await response.json();

          const riskScore = Number(data.risk_score ?? 0);
const urlhausStatus = data.urlhaus?.status || "Unavailable";

const riskExplanation =
  riskScore >= 60
    ? "High Risk: This QR code leads to a URL with multiple suspicious indicators."
    : riskScore >= 20
    ? "Suspicious: This QR code leads to a URL that requires further investigation."
    : "Low Risk: No significant suspicious indicators were detected.";

const urlhausExplanation =
  urlhausStatus === "listed"
    ? "URLhaus reports this URL as a known malicious URL."
    : urlhausStatus === "not_listed"
    ? "URLhaus found no matching malicious URL record."
    : "URLhaus verification is unavailable.";

setMessage(
  `Risk: ${riskScore}/100 | URLhaus: ${urlhausStatus}\n\n${riskExplanation}\n${urlhausExplanation}`
);
          } catch {
            setMessage("Unable to connect to CyberVault backend.");
          }
        }}
      >
        Scan QR URL for Threats
      </button>
    ) : (
      <p>This QR code does not contain a web URL.</p>
    )}
  </div>
)}
    </section>
  );
}

export default QRShield;