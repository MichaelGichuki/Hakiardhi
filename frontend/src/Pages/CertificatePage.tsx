import { Landmark, Printer } from "lucide-react";
import { PageHeading } from "../Components/PageHeading";
import { Badge } from "../Components/Badge";
import { useState } from "react";

export function CertificatePage() {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <PageHeading
        title="Digital Title Certificate"
        subtitle="Formal, printable title deed prototype."
        action={
          <button className="btn primary" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save PDF
          </button>
        }
      />
      <div className="certificate-wrap section-gap" id="print-certificate">
        <div className="certificate">
          <div className="cert-country">REPUBLIC OF KENYA</div>
          <div className="cert-seal">
            <Landmark size={27} />
          </div>
          <h2>MINISTRY OF LANDS</h2>
          <h3>DIGITAL LAND TITLE CERTIFICATE</h3>
          <div className="cert-rule" />
          <Badge tone="amber">VERSION 2 · SUPERSEDES VERSION 1</Badge>
          <p className="cert-intro">CERTIFICATE OF TITLE</p>
          <div className="cert-parcel">KJD/LOI/4581</div>
          <p>
            This certifies that the registered proprietor of the parcel
            described below is:
          </p>
          <h2 className="cert-owner">MARY WANJIKU KAMAU</h2>
          <div className="cert-details">
            <div>
              <small>COUNTY</small>
              <b>Kajiado</b>
            </div>
            <div>
              <small>REGISTRATION AREA</small>
              <b>Loitokitok</b>
            </div>
            <div>
              <small>AREA</small>
              <b>0.045 Hectares</b>
            </div>
            <div>
              <small>TENURE</small>
              <b>Freehold</b>
            </div>
            <div>
              <small>REGISTERED</small>
              <b>14 March 2018</b>
            </div>
            <div>
              <small>TITLE VERSION</small>
              <b>Version 2</b>
            </div>
          </div>
          <div className="cert-rule" />
          <div className="cert-bottom">
            <div>
              <small>UNIQUE VERIFICATION ID</small>
              <b>HA-KJD-4581-V2-2026</b>
              <small>BLOCKCHAIN SHA-256 DIGEST</small>
              <div className="hash">
                7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f
              </div>
            </div>
            <div className="qr-wrap">
              <div className="qr" aria-label="Illustrative QR code">
                {Array.from({ length: 81 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      background:
                        (i * 7 + i * i * 3) % 11 < 5 ||
                        [
                          0, 1, 2, 9, 10, 18, 20, 54, 56, 72, 73, 74, 80,
                        ].includes(i)
                          ? "#263c35"
                          : "#fff",
                    }}
                  />
                ))}
              </div>
              <small>SCAN TO VERIFY TITLE</small>
            </div>
          </div>
          <div className="cert-rule" />
          <div className="cert-issuer">
            <div>
              <small>ISSUING AUTHORITY</small>
              <b>Land Registrar · Kajiado</b>
            </div>
            <Badge tone="green">Ledger anchored</Badge>
          </div>
          <p className="cert-disclaimer">
            Synthetic demonstration certificate only. Not a legally issued title
            deed. Verify through the official land registry before relying on
            ownership claims.
          </p>
        </div>
      </div>
    </>
  );
}
