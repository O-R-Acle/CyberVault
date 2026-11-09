import React, { useState } from "react";

function MessageScanner() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("cybervault-message-history")
    ) || [];
  } catch {
    return [];
  }
});

  const scanMessage = () => {
    if (!message.trim()) {
      setResult({
        status: "Invalid Input",
        score: 0,
        findings: ["Please enter a message to scan."]
      });
      return;
    }

    const findings = [];
    const text = message.toLowerCase();

    const suspiciousWords = [
  "urgent",
  "immediately",
  "verify your account",
  "suspended",
  "limited time",
  "click here",
  "claim your prize",
  "otp",
  "password",
  "bank details",
  "one-time password",
  "share your otp",
  "send your otp",
  "upi pin",
  "atm pin",
  "enter your pin",
  "send money",
  "transfer money",
  "processing fee",
  "lottery winner",
  "you have won",
  "prize money",
  "account blocked",
  "kyc update"
];

    suspiciousWords.forEach((word) => {
      if (text.includes(word)) {
        findings.push(`Suspicious phrase detected: "${word}"`);
      }
    });

    const urlPattern = /https?:\/\/[^\s]+/gi;
    const links = message.match(urlPattern) || [];

    if (links.length > 0) {
      findings.push(`${links.length} web link(s) detected.`);
    }

    // Detect phone numbers
const phonePattern = /(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
const phoneNumbers = message.match(phonePattern) || [];

if (phoneNumbers.length > 0) {
  findings.push(`${phoneNumbers.length} phone number(s) detected.`);
}
    // Detect financial pressure
const paymentPatterns = [
  /pay\s+now/i,
  /transfer\s+within\s+\d+/i,
  /send\s+payment/i,
  /pay\s+to\s+receive/i,
  /refund\s+processing\s+fee/i,
  /limited\s+time\s+offer/i
];

paymentPatterns.forEach((pattern) => {
  if (pattern.test(message)) {
    findings.push("Possible payment pressure detected.");
  }
});
    // Categorize detected threats
const categories = [];

if (
  /otp|one-time password|upi pin|atm pin|password/i.test(message)
) {
  categories.push("OTP & PIN Fraud");
}

if (
  /account blocked|account suspended|account is suspended|suspended|verify your account|kyc update/i.test(message)
) {
  categories.push("Account Security");
}

if (
  /pay now|send payment|transfer money|bank details|prize money|processing fee/i.test(message)
) {
  categories.push("Financial Scams");
}

if (links.length > 0) {
  categories.push("Suspicious Links");
}

if (
  /lottery|you have won|claim your prize|prize money/i.test(message)
) {
  categories.push("Prize & Lottery Scams");
}

    const score = Math.min(findings.length * 20, 100);


    setResult({
      status:
        score >= 60
          ? "High Risk Indicators"
          : score >= 20
          ? "Suspicious Indicators"
          : "Low Risk Indicators",
      score,
      findings,
      categories
    });
    const scanRecord = {
  message,
  score,
  status:
    score >= 60
      ? "High Risk Indicators"
      : score >= 20
      ? "Suspicious Indicators"
      : "Low Risk Indicators",
  timestamp: new Date().toLocaleString()
};

const updatedHistory = [scanRecord, ...history].slice(0, 10);

setHistory(updatedHistory);

localStorage.setItem(
  "cybervault-message-history",
  JSON.stringify(updatedHistory)
);
};

  return (
    <section className="message-scanner" id="message-scanner">
      <p className="muted">MESSAGE THREAT INVESTIGATION</p>

      <h2>Message Scanner</h2>

      <p>
        Check suspicious SMS, emails and messages for possible phishing signs.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Paste a suspicious message here..."
        rows="6"
      />

      <button onClick={scanMessage}>
        Scan Message
      </button>

      {result && (
        <div className="message-result">
          <h3>{result.status}</h3>
          <p>Risk Score: {result.score}/100</p>

          <div className="message-risk-meter">
  <div className="message-risk-track">
    <div
      className="message-risk-fill"
      style={{ width: `${result.score}%` }}
    ></div>
  </div>
  <p>
    {result.score <= 20
      ? "Low Risk"
      : result.score <= 40
      ? "Moderate Risk"
      : result.score <= 70
      ? "High Risk"
      : "Critical Risk"}
  </p>
</div>
{result.categories.length > 0 && (
  <div className="threat-categories">
    <h4>Detected Threat Categories</h4>

    <div className="threat-category-list">
      {result.categories.map((category, index) => (
        <span className="threat-category-badge" key={index}>
          ⚠ {category}
        </span>
      ))}
    </div>
  </div>
)}

          {result.findings.length > 0 ? (
            result.findings.map((item, index) => (
              <p key={index}>• {item}</p>
            ))
          ) : (
            <p>No obvious suspicious patterns detected.</p>
          )}

          <p className="result-note">
            This is a preliminary keyword-based check, not proof that a
            message is safe or malicious.
          </p>
        </div>
      )}
      <div className="scan-history">
  <h3>Message Scan History</h3>
  <button
  onClick={() => {
    setHistory([]);
    localStorage.removeItem("cybervault-message-history");
  }}
>
  Clear History
</button>

  {history.length === 0 ? (
    <p>No previous message scans yet.</p>
  ) : (
    history.map((item, index) => (
      <div className="history-item" key={index}>
        <h4>{item.status}</h4>
        <p>Risk Score: {item.score}/100</p>
        <p>{item.message.slice(0, 100)}</p>
        <small>{item.timestamp}</small>
      </div>
    ))
  )}
</div>
    </section>
  );
}

export default MessageScanner;