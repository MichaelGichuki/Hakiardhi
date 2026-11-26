import { Landmark, Printer, Search } from "lucide-react";
import { PageHeading } from "../Components/PageHeading";
import { Badge } from "../Components/Badge";
import { useEffect, useState } from "react";
import { Card } from "../Components/Card";
import type { ParcelDetailsDto, parcelDto } from "../types/parcels.type";
import { parcelRecords } from "../service/parcels";
import { useDebounce } from "../app/hooks";

export function CertificatePage() {
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [selected, selectParcel] = useState("");
  const [parcel, setParcel] = useState<ParcelDetailsDto | undefined>();
  const [list, setList] = useState<parcelDto[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 100);

  const handlerSearch = async (search: string) => {
    try {
      const res = await parcelRecords.searchParcels(search);
      setList(res.data);
    } catch {}
  };

    const getParcel = async (id: string) => {
    try{
      const res = await parcelRecords.getParcels(id);
      setParcel(res.data);
    } catch{

    }
   }

  useEffect(() => {
    if (!debouncedSearch.trim()) return;
    handlerSearch(debouncedSearch);
  }, [debouncedSearch]);

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
      <Card>
        <div className="search-row">
          <input
            id="tamper-parcel-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                selectParcel(searchQuery);
              }
            }}
            placeholder="e.g. KJD/LOI/4581 or NYR/KGN/1104"
          />
          <button
            disabled={isSearching}
            type="button"
            className="btn primary"
            onClick={() => {
              selectParcel(searchQuery);
              getParcel(searchQuery)
            }}
          >
            <Search size={14} /> {isSearching ? "Fetching..." : "Search"}
          </button>
        </div>
        <div className="tamper-quick-chips">
          <span className="muted">Indexed parcels:</span>
          {list.map((code, index) => {
            return (
              <button
                key={index}
                type="button"
                className="tamper-chip"
                onClick={() => setSearchQuery(code.parcelNumber)}
              >
                <span>{code.parcelNumber}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {parcel && (
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
            <div className="cert-parcel">{parcel?.parcelNumber}</div>
            <p>
              This certifies that the registered proprietor of the parcel
              described below is:
            </p>
            <h2 className="cert-owner">{parcel?.ownerName}</h2>
            <div className="cert-details">
              <div>
                <small>COUNTY</small>
                <b>{parcel?.county}</b>
              </div>
              <div>
                <small>REGISTRATION AREA</small>
                <b>{parcel?.county}</b>
              </div>
              <div>
                <small>AREA</small>
                <b>{parcel?.size} Hectares</b>
              </div>
              <div>
                <small>TENURE</small>
                <b>{parcel?.tenure}</b>
              </div>
              <div>
                <small>REGISTERED</small>
                <b>{`${parcel?.registrationDate}`}</b>
              </div>
              <div>
                <small>TITLE VERSION</small>
                <b>Version {parcel?.titleVersion}</b>
              </div>
            </div>
            <div className="cert-rule" />
            <div className="cert-bottom">
              <div>
                <small>UNIQUE VERIFICATION ID</small>
                <b>HA-KJD-4581-V2-2026</b>
                <small>BLOCKCHAIN SHA-256 DIGEST</small>
                <div className="hash">{parcel?.sha256}</div>
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
              Synthetic demonstration certificate only. Not a legally issued
              title deed. Verify through the official land registry before
              relying on ownership claims.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
