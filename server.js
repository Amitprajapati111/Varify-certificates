const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Handle Vercel serverless environment (/tmp is writable, root is read-only)
const isVercel = Boolean(process.env.VERCEL);
const DATA_FILE = isVercel ? path.join("/tmp", "certificates.json") : path.join(__dirname, "certificates.json");
const BUNDLED_FILE = path.join(__dirname, "certificates.json");

// Default certificate template if file doesn't exist
const DEFAULT_CERTIFICATES = {
  "INFOSYS-ISB1-2025": {
    certificateId: "INFOSYS-ISB1-2025",
    issuedTo: "Amit Kumar",
    eventName: "Internship 6.0 (B1): Development of Civic Issue Reporting & Tracking Application",
    startDate: "06 Aug 2025",
    endDate: "10 Oct 2025",
    issuanceDate: "27 Nov 2025",
    issuer: "Infosys Springboard",
    recordStatus: "Record found"
  }
};

function loadCertificates() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } else if (isVercel && fs.existsSync(BUNDLED_FILE)) {
      const content = fs.readFileSync(BUNDLED_FILE, "utf-8");
      const parsed = JSON.parse(content);
      saveCertificates(parsed);
      return parsed;
    }
  } catch (err) {
    console.error("Error reading certificates, falling back to defaults:", err);
  }
  saveCertificates(DEFAULT_CERTIFICATES);
  return { ...DEFAULT_CERTIFICATES };
}

function saveCertificates(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: could not write to disk:", err.message);
  }
}

let certificates = loadCertificates();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// List all certificate records
app.get("/api/certificates", (req, res) => {
  res.json({ certificates });
});

// Single certificate lookup
app.get("/api/certificates/:id", (req, res) => {
  const reqId = req.params.id.toUpperCase();
  const certificate = certificates[reqId] || (reqId === "INFOSYS-ISB1-2025-AMIT" ? certificates["INFOSYS-ISB1-2025"] : null);
  if (!certificate) {
    return res.status(404).json({ found: false, message: "No certificate record was found for this ID." });
  }
  res.json({ found: true, certificate });
});

// Create or update a certificate record
app.post("/api/certificates", (req, res) => {
  const {
    certificateId,
    issuedTo,
    eventName,
    startDate,
    endDate,
    issuanceDate,
    issuer,
    recordStatus
  } = req.body;

  if (!certificateId || !issuedTo || !eventName) {
    return res.status(400).json({ success: false, message: "Certificate ID, Issued To, and Event Name are required." });
  }

  const id = certificateId.trim().toUpperCase();
  const certData = {
    certificateId: id,
    issuedTo: (issuedTo || "").trim(),
    eventName: (eventName || "").trim(),
    startDate: (startDate || "").trim(),
    endDate: (endDate || "").trim(),
    issuanceDate: (issuanceDate || "").trim(),
    issuer: (issuer || "Infosys Springboard").trim(),
    recordStatus: (recordStatus || "Record found").trim()
  };

  certificates[id] = certData;
  saveCertificates(certificates);

  res.json({ success: true, certificate: certData });
});

// Delete a certificate record
app.delete("/api/certificates/:id", (req, res) => {
  const id = req.params.id.toUpperCase();
  if (!certificates[id]) {
    return res.status(404).json({ success: false, message: "Certificate record not found." });
  }
  delete certificates[id];
  saveCertificates(certificates);
  res.json({ success: true, message: `Certificate ${id} deleted successfully.` });
});

// Generate QR code for a certificate
app.get("/api/qr/:id", async (req, res) => {
  const reqId = req.params.id.toUpperCase();
  const id = certificates[reqId] ? reqId : (reqId === "INFOSYS-ISB1-2025-AMIT" && certificates["INFOSYS-ISB1-2025"] ? "INFOSYS-ISB1-2025" : reqId);
  const cert = certificates[id];
  if (!cert) return res.status(404).json({ message: "Unknown certificate ID." });

  // Base URL can be provided via query param (e.g. from admin panel), env variable, or inferred from request
  const customBaseUrl = req.query.baseUrl;
  const baseUrl = (customBaseUrl || process.env.BASE_URL || `${req.protocol}://${req.get("host")}` || `http://localhost:${PORT}`).replace(/\/$/, "");

  // Encode certificate data into QR URL so verification works permanently across restarts
  const payload = Buffer.from(JSON.stringify(cert)).toString("base64");
  const verificationUrl = `${baseUrl}/verify/${encodeURIComponent(id)}?d=${encodeURIComponent(payload)}`;

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 500,
      color: { dark: "#10231d", light: "#ffffff" }
    });
    res.json({ verificationUrl, dataUrl, certificateId: id });
  } catch (err) {
    res.status(500).json({ message: "Could not generate QR code." });
  }
});

// Admin dashboard route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Verification URL route
app.get("/verify/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Certificate site running at http://localhost:${PORT}`));
}

module.exports = app;
