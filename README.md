# Certificate Record Portal & Admin Manager

A Node.js & Express web application for managing internship and certificate verification records, generating scannable QR codes, and viewing verification pages.

## Features
- **Admin Dashboard (`/admin`)**:
  - Add or update internship details (Recipient name, Event/Internship title, Start/End dates, Issuance date, Issuer, Status).
  - Auto-generate unique certificate IDs or use custom ones.
  - Set custom production domain / base URL for QR codes.
  - Instant high-resolution QR code generator.
  - One-click QR code download as PNG (`QR_<certificateId>.png`).
  - View, edit, or delete existing certificate records stored in `certificates.json`.
- **Public Verification View (`/verify/:id`)**:
  - Clean, official certificate record lookup page.
  - Responsive design optimized for mobile phone camera scanning and desktop.

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. Open in your browser:
   - **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Verification View**: [http://localhost:3000/verify/INFOSYS-ISB1-2025-AMIT](http://localhost:3000/verify/INFOSYS-ISB1-2025-AMIT)

## Generating & Downloading QR Codes
1. Go to `http://localhost:3000/admin`.
2. Fill in the internship and certificate details.
3. If deploying to production (e.g. `https://my-cert-portal.com`), enter that domain in the **QR Link Domain / Base URL** field so phone cameras navigate to your live site.
4. Click **Save & Generate QR**.
5. Click **Download QR Code (PNG)** to save the high-resolution QR image.
