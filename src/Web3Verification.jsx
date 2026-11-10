
import { useState } from "react";

function Web3Verification() {
  // DOCUMENT VERIFICATION
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [referenceHash, setReferenceHash] = useState("");
  const [verification, setVerification] = useState("");
  const [error, setError] = useState("");

  // OFFLINE CERTIFICATE
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState("");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");

  // WALLET VERIFICATION
  const [walletAddress, setWalletAddress] = useState("");
  const [walletNetwork, setWalletNetwork] = useState("ethereum");
  const [walletResult, setWalletResult] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  // TRANSACTION VERIFICATION
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionResult, setTransactionResult] = useState(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  // NETWORK CONFIGURATION
  const networks = {
    ethereum: {
      name: "Ethereum Mainnet",
      chainId: "0x1",
      rpc: "https://ethereum-rpc.publicnode.com",
    },
    sepolia: {
      name: "Sepolia Testnet",
      chainId: "0xaa36a7",
      rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    },
  };

  // COMMON RPC REQUEST
  const rpcRequest = async (network, method, params) => {
    const response = await fetch(network.rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error("Blockchain RPC request failed.");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "RPC error.");
    }

    return data.result;
  };

  // FILE SELECTION
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
    setFileHash("");
    setVerification("");
    setError("");
    setCertificateStatus("");
    setCertificateError("");
  };

  // GENERATE SHA-256 FINGERPRINT
  const generateHash = async () => {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Please select a file smaller than 25 MB.");
      return;
    }

    try {
      setError("");
      setVerification("");

      const fileData = await selectedFile.arrayBuffer();

      const digest = await crypto.subtle.digest(
        "SHA-256",
        fileData
      );

      const hash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      setFileHash(hash);
    } catch {
      setError("Unable to generate the document fingerprint.");
    }
  };

  // VERIFY DOCUMENT AGAINST REFERENCE HASH
  const verifyHash = () => {
    const expected = referenceHash.trim().toLowerCase();

    if (!/^[a-f0-9]{64}$/.test(expected)) {
      setError("Please enter a valid 64-character SHA-256 hash.");
      return;
    }

    setError("");

    setVerification(
      fileHash === expected ? "verified" : "modified"
    );
  };

  // DOWNLOAD OFFLINE CERTIFICATE
  const downloadCertificate = () => {
    if (!fileHash || !selectedFile) {
      setCertificateError("Generate a fingerprint first.");
      return;
    }

    const certificate = {
      project: "CyberVault",
      document: selectedFile.name,
      sha256: fileHash,
      algorithm: "SHA-256",
      generatedAt: new Date().toISOString(),
      certificateType: "Offline Document Integrity Certificate",
    };

   const blob = new Blob(
  [JSON.stringify(certificate, null, 2)],
  { type: "application/json" }
);

const downloadUrl = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = downloadUrl;
link.download = "CyberVault-Certificate.json";
link.style.display = "none";

document.body.appendChild(link);
link.click();
link.remove();

setTimeout(() => {
  URL.revokeObjectURL(downloadUrl);
}, 1000);

    setCertificateError("");
    setCertificateStatus("Certificate downloaded successfully.");
  };

  // VERIFY UPLOADED OFFLINE CERTIFICATE
  const verifyCertificate = async () => {
    setCertificateError("");
    setCertificateStatus("");

    if (!selectedFile || !fileHash) {
      setCertificateError("Select a document and generate its fingerprint first.");
      return;
    }

    if (!certificateFile) {
      setCertificateError("Please upload a CyberVault certificate.");
      return;
    }

    setCertificateLoading(true);

    try {
      const text = await certificateFile.text();
      let certificate;

try {
  certificate = JSON.parse(text);
} catch {
  throw new Error(
    "Invalid certificate file. Please upload a valid CyberVault JSON certificate, not an image or document."
  );
}

      if (
        certificate.project !== "CyberVault" ||
        certificate.algorithm !== "SHA-256" ||
        !/^[a-f0-9]{64}$/i.test(certificate.sha256 || "")
      ) {
        throw new Error("Invalid CyberVault certificate format.");
      }

      if (certificate.sha256.toLowerCase() === fileHash) {
  setCertificateStatus(
    "✓ Certificate Verified!\nThe uploaded document matches the SHA-256 fingerprint stored in the certificate.\nThe document integrity check passed."
  );
} else {
  setCertificateStatus(
    "✕ Certificate Mismatch!\nThe uploaded document does not match the SHA-256 fingerprint stored in the certificate.\nThe document may have been modified or may be a different file."
  );
}
    } catch (err) {
      setCertificateError(
        err.message || "Unable to verify certificate."
      );
    } finally {
      setCertificateLoading(false);
    }
  };

  // VERIFY WALLET ADDRESS
  const verifyWallet = async () => {
    const address = walletAddress.trim();

    setWalletError("");
    setWalletResult(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setWalletError("Please enter a valid EVM wallet address.");
      return;
    }

    const network = networks[walletNetwork];

    setWalletLoading(true);

    try {
      const chainId = await rpcRequest(
        network,
        "eth_chainId",
        []
      );

      if (chainId !== network.chainId) {
        throw new Error("Blockchain network mismatch.");
      }

      const [balanceHex, contractCode] = await Promise.all([
        rpcRequest(network, "eth_getBalance", [
          address,
          "latest",
        ]),
        rpcRequest(network, "eth_getCode", [
          address,
          "latest",
        ]),
      ]);

      const balanceWei = BigInt(balanceHex);
      const divisor = 10n ** 18n;

      const whole = balanceWei / divisor;

      const fraction = (balanceWei % divisor)
        .toString()
        .padStart(18, "0")
        .slice(0, 6)
        .replace(/0+$/, "");

      const balance = fraction
        ? `${whole}.${fraction}`
        : whole.toString();

      setWalletResult({
        address,
        network: network.name,
        balance,
        addressType:
          contractCode === "0x"
            ? "Externally Owned Account (EOA)"
            : "Smart Contract",
        contractDetected: contractCode !== "0x",
      });
    } catch (err) {
      setWalletError(
        err.message || "Unable to verify this wallet."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  // VERIFY TRANSACTION
  const verifyTransaction = async () => {
    const hash = transactionHash.trim();

    setTransactionError("");
    setTransactionResult(null);

    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      setTransactionError(
        "Please enter a valid 66-character transaction hash."
      );
      return;
    }

    const network = networks[walletNetwork];

    setTransactionLoading(true);

    try {
      const chainId = await rpcRequest(
        network,
        "eth_chainId",
        []
      );

      if (chainId !== network.chainId) {
        throw new Error("Blockchain network mismatch.");
      }

      const [transaction, latestBlock] = await Promise.all([
        rpcRequest(network, "eth_getTransactionByHash", [hash]),
        rpcRequest(network, "eth_blockNumber", []),
      ]);

      if (!transaction) {
        throw new Error(
          "Transaction not found on the selected network."
        );
      }

      const receipt = await rpcRequest(
        network,
        "eth_getTransactionReceipt",
        [hash]
      );

      const formatEther = (hexValue) => {
        const wei = BigInt(hexValue || "0x0");
        const divisor = 10n ** 18n;

        const whole = wei / divisor;

        const fraction = (wei % divisor)
          .toString()
          .padStart(18, "0")
          .slice(0, 8)
          .replace(/0+$/, "");

        return fraction
          ? `${whole}.${fraction}`
          : whole.toString();
      };

      const hasBlock = transaction.blockNumber !== null;

      const blockNumber = hasBlock
        ? BigInt(transaction.blockNumber)
        : null;

      const currentBlock = BigInt(latestBlock);

      const confirmations = !hasBlock
        ? "0"
        : (
            currentBlock - blockNumber + 1n
          ).toString();

      const status = !hasBlock
        ? "Pending"
        : !receipt
        ? "Mined — Receipt Unavailable"
        : receipt.status === "0x1"
        ? "Successful"
        : receipt.status === "0x0"
        ? "Failed"
        : "Unknown";

      setTransactionResult({
        hash,
        network: network.name,
        from: transaction.from,
        to: transaction.to || "Contract Creation",
        value: formatEther(transaction.value),
        blockNumber: hasBlock
          ? blockNumber.toString()
          : "Not mined",
        confirmations,
        status,
      });
    } catch (err) {
      setTransactionError(
        err.message || "Unable to verify transaction."
      );
    } finally {
      setTransactionLoading(false);
    }
  };

  return (
    <section className="scanner" id="web3-verification">

      <p className="muted">
        BLOCKCHAIN & DOCUMENT SECURITY
      </p>

      <h2>Web3 Verification</h2>

      {/* DOCUMENT FINGERPRINT */}

      <h3>Report & Certificate Integrity</h3>

      <p>
        Generate a unique SHA-256 fingerprint for your
        security reports and certificates.
      </p>

      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        onChange={handleFileChange}
      />

      {selectedFile && (
        <p>Selected file: {selectedFile.name}</p>
      )}

      <button
        onClick={generateHash}
        disabled={!selectedFile}
      >
        Generate SHA-256 Fingerprint
      </button>

      {error && <p>{error}</p>}

      {fileHash && (
        <div className="scan-result">
          <h3>Document Fingerprint</h3>

          <code style={{ wordBreak: "break-all" }}>
            {fileHash}
          </code>

          <p>
            This fingerprint represents the exact contents
            of your selected file.
          </p>
        </div>
      )}

      {/* OFFLINE CERTIFICATE */}

      {fileHash && (
        <div className="scan-result">
          <h3>Offline Report Certificate</h3>

          <p>
            Generate a downloadable certificate containing
            your document's SHA-256 fingerprint.
          </p>

          <button onClick={downloadCertificate}>
            Download Digital Certificate
          </button>

          {certificateStatus && (
            <p>{certificateStatus}</p>
          )}

          {certificateError && (
            <p>{certificateError}</p>
          )}
        </div>
      )}

      {/* CERTIFICATE VERIFICATION */}

      <h3>Verify Offline Certificate</h3>

      <p>
        Upload a previously generated CyberVault certificate
        to check document integrity.
      </p>

      <input
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          setCertificateFile(
            event.target.files?.[0] || null
          );
          setCertificateStatus("");
          setCertificateError("");
        }}
      />

      {certificateFile && (
        <p>Certificate: {certificateFile.name}</p>
      )}

      <button
        onClick={verifyCertificate}
        disabled={
          !selectedFile ||
          !fileHash ||
          !certificateFile ||
          certificateLoading
        }
      >
        {certificateLoading
          ? "Verifying Certificate..."
          : "Verify Digital Certificate"}
      </button>

      {certificateStatus && (
  <div className="scan-result">
    <div className="explainable-findings">
      {certificateStatus.split("\n").map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  </div>
)}

      {certificateError && (
        <p>{certificateError}</p>
      )}

      <hr />

      {/* DOCUMENT INTEGRITY */}

      <h3>Verify Document Integrity</h3>

      <p>
        Enter a previously trusted SHA-256 fingerprint
        to check whether the document has changed.
      </p>

      <input
        className="url-input"
        type="text"
        placeholder="Paste reference SHA-256 hash"
        value={referenceHash}
        onChange={(event) => {
          setReferenceHash(event.target.value);
          setVerification("");
          setError("");
        }}
      />

      <button
        onClick={verifyHash}
        disabled={!fileHash || !referenceHash.trim()}
      >
        Verify Document
      </button>

      {verification === "verified" && (
        <div className="scan-result">
          <h3>✓ Integrity Verified</h3>
          <p>
            The document matches the supplied reference fingerprint.
          </p>
        </div>
      )}

      {verification === "modified" && (
        <div className="scan-result">
          <h3>⚠ Fingerprint Mismatch</h3>
          <p>
            The document does not match the supplied reference fingerprint.
          </p>
        </div>
      )}

      <hr />

      {/* WALLET ADDRESS VERIFICATION */}

      <h3>Wallet Address Verification</h3>

      <p>
        Check an EVM wallet address and its balance
        using public blockchain data.
      </p>

      <select
        value={walletNetwork}
        onChange={(event) => {
          setWalletNetwork(event.target.value);
          setWalletResult(null);
          setWalletError("");
          setTransactionResult(null);
          setTransactionError("");
        }}
      >
        <option value="ethereum">Ethereum Mainnet</option>
        <option value="sepolia">Sepolia Testnet</option>
      </select>

      <input
        className="url-input"
        type="text"
        placeholder="Enter 0x wallet address"
        value={walletAddress}
        onChange={(event) => {
          setWalletAddress(event.target.value);
          setWalletResult(null);
          setWalletError("");
        }}
      />

      <button
        onClick={verifyWallet}
        disabled={walletLoading || !walletAddress.trim()}
      >
        {walletLoading
          ? "Verifying..."
          : "Verify Wallet Address"}
      </button>

      {walletError && <p>{walletError}</p>}

      {walletResult && (
        <div className="scan-result">
          <h3>✓ Wallet Lookup Successful</h3>

          <p>
            <strong>Network:</strong> {walletResult.network}
          </p>

          <p><strong>Address:</strong></p>

          <code style={{ wordBreak: "break-all" }}>
            {walletResult.address}
          </code>

          <p>
            <strong>ETH Balance:</strong> {walletResult.balance} ETH
          </p>

          <p>
            <strong>Address Type:</strong> {walletResult.addressType}
          </p>

          <p>
            <strong>Smart Contract Detected:</strong>{" "}
            {walletResult.contractDetected ? "Yes" : "No"}
          </p>
        </div>
      )}

      <hr />

      {/* TRANSACTION VERIFICATION */}

      <h3>Transaction Verification</h3>

      <p>
        Investigate Ethereum transactions using their
        transaction hash.
      </p>

      <input
        className="url-input"
        type="text"
        placeholder="Enter transaction hash (0x...)"
        value={transactionHash}
        onChange={(event) => {
          setTransactionHash(event.target.value);
          setTransactionResult(null);
          setTransactionError("");
        }}
      />

      <button
        onClick={verifyTransaction}
        disabled={
          transactionLoading || !transactionHash.trim()
        }
      >
        {transactionLoading
          ? "Checking Transaction..."
          : "Verify Transaction"}
      </button>

      {transactionError && (
        <p>{transactionError}</p>
      )}

      {transactionResult && (
        <div className="scan-result">
          <h3>Transaction Details</h3>

          <p>
            <strong>Status:</strong> {transactionResult.status}
          </p>

          <p>
            <strong>Network:</strong> {transactionResult.network}
          </p>

          <p><strong>Transaction Hash:</strong></p>

          <code style={{ wordBreak: "break-all" }}>
            {transactionResult.hash}
          </code>

          <p><strong>From:</strong></p>

          <code style={{ wordBreak: "break-all" }}>
            {transactionResult.from}
          </code>

          <p><strong>To:</strong></p>

          <code style={{ wordBreak: "break-all" }}>
            {transactionResult.to}
          </code>

          <p>
            <strong>Value:</strong> {transactionResult.value} ETH
          </p>

          <p>
            <strong>Block:</strong> {transactionResult.blockNumber}
          </p>

          <p>
            <strong>Confirmations:</strong>{" "}
            {transactionResult.confirmations}
          </p>
        </div>
      )}

    </section>
  );
}

export default Web3Verification;
