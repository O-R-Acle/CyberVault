# CyberVault

### Uncover threats. Protect trust.

CyberVault is a web-based cybersecurity assessment platform designed to help users identify potentially suspicious URLs, QR codes, phishing messages, and domain-level security issues. It also includes document integrity verification using SHA-256 hashing.

## Features

### 1. URL Security Scanner
- Scans URLs for suspicious patterns.
- Checks for suspicious keywords and multiple hyphens.
- Identifies potential security risks.
- Provides a risk score and assessment.

### 2. QR Shield
- Allows users to upload and scan QR code images.
- Extracts URLs from QR codes.
- Supports URL risk assessment.
- Includes URLhaus-based threat checking.

### 3. Message Scanner
- Analyzes text messages for potential phishing indicators.
- Identifies suspicious patterns, including OTP/PIN fraud and account-security-related language.
- Displays a risk score and security assessment.

### 4. Domain Intelligence
- Performs DNS lookup checks.
- Examines SSL certificate validity and expiry information.
- Provides an overall domain security assessment.

### 5. Web3 Verification
- Generates SHA-256 document fingerprints.
- Creates downloadable JSON verification certificates.
- Verifies document integrity by comparing uploaded documents with their certificates.
- Includes a wallet-signing interface.

### 6. Security Dashboard
- Displays total recorded scans.
- Shows high-risk, suspicious, and low-risk assessments.
- Provides risk distribution analytics.
- Displays a security assessment score.
- Shows recent security activity.

### 7. Scan History
- Maintains records of URL, QR, message, and domain scans.
- Uses browser Local Storage to retain scan history.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Development Server | Vite |
| Styling | CSS |
| Backend | Python, FastAPI |
| Document Hashing | SHA-256 |
| Threat Intelligence | URLhaus |
| Browser Storage | Local Storage |
| Web3 Interface | MetaMask integration interface |

## Project Structure

```text
CyberVault/
│
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── Web3Verification.jsx
│   ├── QRShield.jsx
│   ├── MessageScanner.jsx
│   └── DomainIntelligence.jsx
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── package.json
├── index.html
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Git (optional)

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
cd CyberVault
```

Replace `YOUR_REPOSITORY_URL` with your GitHub repository URL.

### 2. Start the Backend

Open a terminal in the CyberVault directory:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend URL:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 3. Start the React + Vite Application

Open a second terminal in the CyberVault root directory:

```bash
npm install
npm run dev
```

Open the application:

`http://localhost:5173`

Keep both frontend and backend servers running while using CyberVault.

## Security Disclaimer

CyberVault is an educational and experimental cybersecurity assessment project.

Its risk scores are based on implemented checks and available threat-intelligence responses. They do not guarantee that a website, message, QR code, or domain is safe or malicious.

CyberVault should not be considered a replacement for professional cybersecurity tools or security audits.

## Current Limitations

- Risk assessments use heuristic checks and available external threat-intelligence data.
- QR scan history does not currently contribute to risk distribution.
- Wallet-based signing and on-chain transaction verification have not yet been fully tested.
- Scan history is stored locally in the browser.

## Future Improvements

- Advanced phishing detection using machine learning.
- Expanded threat-intelligence integrations.
- Improved QR code security analysis.
- Complete wallet-signing and blockchain verification.
- Enhanced security analytics and reporting.
- Cloud-based scan history and user accounts.

## Project Goal

The goal of CyberVault is to make essential cybersecurity checks more accessible through a single, beginner-friendly platform combining security analysis, threat intelligence, and document integrity verification.

---

**CyberVault v1.0**

*AI + Cybersecurity + Web3*