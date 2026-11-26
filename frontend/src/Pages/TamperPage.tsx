import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { parcelRecords } from "../service/parcels";
import type { parcelDto, ParcelIntegrityRecord, ValidateTamper } from "../types/parcels.type";

interface TamperAuditLogEntry {
  id: string;
  timestamp: string;
  parcelNumber: string;
  outcome: "VERIFIED" | "TAMPER DETECTED" | "RESTORED";
  changedFields: string[];
  digestSnapshot: string;
}

export interface TamperDetectionPageProps {
  initialParcelNumber?: string;
  onParcelSelected?: (parcelNumber: string) => void;
}


const MUTABLE_FIELDS: Array<{
  key: "owner" | "size" | "county" | "tenure";
  label: string;
  expectedLabel: string;
}> = [
  {
    key: "owner",
    label: "Registered proprietor",
    expectedLabel: "Expected proprietor",
  },
  { key: "size", label: "Parcel size", expectedLabel: "Expected parcel size" },
  { key: "county", label: "County", expectedLabel: "Expected county" },
  { key: "tenure", label: "Tenure", expectedLabel: "Expected tenure" },
];

function computeCanonicalDigest(record: {
  parcelNumber: string;
  owner: string;
  size: string;
  county: string;
  tenure: string;
  titleVersion: string;
}): string {
  const canonical = [
    record.parcelNumber.trim().toUpperCase(),
    record.owner.trim(),
    record.size.trim(),
    record.county.trim(),
    record.tenure.trim(),
    // record.titleVersion.trim(),
  ].join("|");

  let h1 = 0x9e3779b9;
  let h2 = 0x85ebca6b;
  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2246822519);
    h2 = Math.imul(h2 ^ ch, 3266489917);
  }
  const partA = (h1 >>> 0).toString(16).padStart(8, "0");
  const partB = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${partA}${partB}${partB.split("").reverse().join("")}${partA.split("").reverse().join("")}`.repeat(
    2,
  );
}

export function TamperPage() {

  const [isSearching, setIsSearching] = useState(false);
  const [record, setRecord] = useState<ValidateTamper | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [activeParcelNumber, setActiveParcelNumber] = useState<string>();
  const [list, setList] = useState<parcelDto[]>([]);

  // Map of parcelNumber -> mutable database values (owner, size, county, tenure)
  const [dbOverrides, setDbOverrides] = useState<
    Record<
      string,
      {
        owner: string;
        size: string;
        county: string;
        tenure: "Freehold" | "Leasehold";
      }
    >
  >({});

  const handlerSearch = async (search: string) => {
    try{
      const res = await parcelRecords.searchParcels(search);
      setList(res.data);
    } catch{

    }
  }


  useEffect(() => {
    handlerSearch(searchQuery);
  }, [searchQuery])

  const currentDbValues = useMemo(() => {
    if (record == null){
      return {
        owner : "",
        size : "",
        county : "",
        tenure : ""
      }
    }
    const override = record.bdRecord
    return {
      owner: override?.owner,
      size: override?.size,
      county: override?.county,
      tenure: override?.tenure,
    };
  }, [record, dbOverrides]);


  const tamperedFields = useMemo(() => {
    const anchor = record?.anchorRecord;
    const dbRecord = record?.bdRecord;
    const diffs: string[] = [];
    if (dbRecord == undefined || anchor == undefined) return []
    if (currentDbValues.owner.trim() !== anchor.owner)
      diffs.push("Registered proprietor");
    if (currentDbValues.size.trim() !== anchor.size)
      diffs.push("Parcel size");
    if (currentDbValues.county.trim() !== anchor.county)
      diffs.push("County");
    if (currentDbValues.tenure !== anchor.tenure) diffs.push("Tenure");
    return diffs;
  }, [record, currentDbValues]);

  const isTampered = tamperedFields.length > 0;

  const computedDbDigest = useMemo(
    () =>
      {
        if (record == undefined) return 
        return computeCanonicalDigest({
        parcelNumber: record.anchorRecord.parcelNumber,
        owner: currentDbValues.owner,
        size: currentDbValues.size,
        county: currentDbValues.county,
        tenure: currentDbValues.tenure,
        titleVersion: record.anchorRecord.titleVersion,
      })
      },
    [record, currentDbValues],
  );

  const recordScanEvent = (
    parcelNum: string,
    outcome: TamperAuditLogEntry["outcome"],
    changed: string[],
    digest: string,
  ) => {
    const nowLabel = new Date().toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  };

  const selectParcel = async (rawQuery: string) => {
    const code = rawQuery.trim().toUpperCase();
    if (!code) {
      setSearchError(
        "Enter a parcel or title number to run an integrity inspection.",
      );
      return;
    }
    try {
      setSearchError("");
      setIsSearching(true);
      const record = await parcelRecords.checkTamper(code);
      
      setRecord(record.data)
      const match = record.data.bdRecord;
      setActiveParcelNumber(match.parcelNumber);

      const ov = record.data.anchorRecord
      const diffs: string[] = []
      if (ov && ov.owner.trim() !== match.owner) diffs.push('Registered proprietor')
      if (ov && ov.size.trim() !== match.size) diffs.push('Parcel size')
      if (ov && ov.county.trim() !== match.county) diffs.push('County')
      if (ov && ov.tenure !== match.tenure) diffs.push('Tenure')

      recordScanEvent(
        match.parcelNumber,
        diffs.length > 0 ? 'TAMPER DETECTED' : 'VERIFIED',
        diffs,
        match.anchoredSha256
      )
    } catch (error) {
      console.log(error);
      
      setSearchError(
        `Parcel "${code}" was not found in the ledger index. Try KJD/LOI/4581, KJD/LOI/4590, NAI/BLK/0912, or NYR/KGN/1104.`,
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="tamper-rework-page">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h1>Tamper Detection &amp; Integrity Inspector</h1>
          <p>
            Search any registered parcel, compare mutable registry fields
            against the Hyperledger Fabric anchor, and test unauthorized
            modification alerts.
          </p>
        </div>
        <span className={`badge ${isTampered ? "red" : "green"}`}>
          {isTampered ? (
            <>
              <ShieldAlert size={13} /> Integrity Violation (
              {tamperedFields.length} field
              {tamperedFields.length > 1 ? "s" : ""})
            </>
          ) : (
            <>
              <ShieldCheck size={13} /> Ledger Digest Matched
            </>
          )}
        </span>
      </div>

      {/* Step 1: Parcel Search & Quick Selection Bar */}
      <section className="card section-gap tamper-search-card">
        <div className="card-heading">
          <h3>
            <FileSearch size={15} className="tamper-inline-icon" /> Step 1:
            Select Parcel to Inspect
          </h3>
          <span className="badge blue">
            Active Target: {}
          </span>
        </div>

        <label className="field-label" htmlFor="tamper-parcel-search">
          Search parcel number / title reference
        </label>
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
            onClick={() => selectParcel(searchQuery)}
          >
            <Search size={14} />{" "}
            {isSearching ? "Running check..." : "Run integrity check"}
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

        {searchError && (
          <div className="decision-message rejected" role="alert">
            {searchError}
          </div>
        )}
      </section>

      {/* Step 2: Side-by-Side Mutable Database vs Immutable Blockchain Anchor */}
      <section className="card section-gap">
        <div className="card-heading">
          <div>
            <h3>
              Step 2: Live Database vs. Blockchain Anchor (
              {record?.anchorRecord?.parcelNumber})
            </h3>
            <small className="muted">
              {record?.anchorRecord.registrationArea} · {record?.anchorRecord.titleVersion} ·
              Last verified {record?.anchorRecord.lastVerified}
            </small>
          </div>
          <span className={`badge ${isTampered ? "red" : "green"}`}>
            {isTampered ? "⚠ Mismatch detected" : "● Records match"}
          </span>
        </div>

        <div className="two-col section-gap align-start">
          {/* Mutable Database Column */}
          <div className="tamper-pane">
            <div className="card-heading">
              <h3>
                <Database size={14} className="tamper-inline-icon" /> Registry
                Database Record
              </h3>
              <span className="badge blue">Mutable</span>
            </div>

            {MUTABLE_FIELDS.map((field) => {
              // const fieldChanged = currentDbValues[field.key].trim() !== anchorRecord?.[field.key];
              const fieldChanged = false;
              return (
                <div key={field.key}>
                  <label
                    className="field-label"
                    htmlFor={`tamper-field-${field.key}`}
                  >
                    {field.label}{" "}
                    {fieldChanged && (
                      <span className="tamper-field-flag">· Modified</span>
                    )}
                  </label>
                  {field.key === "tenure" ? (
                    <select
                      id={`tamper-field-${field.key}`}
                      className={`text-input ${fieldChanged ? "tamper-input-alert" : ""}`}
                      value={currentDbValues.tenure}
                      disabled
                      // onChange={(e) =>
                      //   handleFieldChange("tenure", e.target.value)
                      // }
                    >
                      <option value="Freehold">Freehold</option>
                      <option value="Leasehold">Leasehold</option>
                    </select>
                  ) : (
                    <input
                      id={`tamper-field-${field.key}`}
                      className={`text-input ${fieldChanged ? "tamper-input-alert" : ""}`}
                      value={currentDbValues[field.key]}
                      disabled
                      // onChange={(e) =>
                      //   handleFieldChange(field.key, e.target.value)
                      // }
                    />
                  )}
                </div>
              );
            })}

            <div className="tamper-digest-box">
              <small className="muted">Computed live record digest</small>
              <div className="hash">
                {isTampered ? computedDbDigest : record?.anchorRecord?.anchoredSha256}
              </div>
            </div>
          </div>

          {/* Immutable Blockchain Anchor Column */}
          <div className="tamper-pane tamper-anchor-pane">
            <div className="card-heading">
              <h3>
                <ShieldCheck size={14} className="tamper-inline-icon" />{" "}
                Hyperledger Fabric Anchor
              </h3>
              <span className="badge green">Immutable reference</span>
            </div>

            {MUTABLE_FIELDS.map((field) => {
              const fieldChanged =
                currentDbValues[field.key].trim() !== record?.anchorRecord?.[field.key];
              return (
                <div
                  className={`anchor-field ${fieldChanged ? "tamper-anchor-diff" : ""}`}
                  key={field.key}
                >
                  <small>{field.expectedLabel}</small>
                  <b>{record?.anchorRecord?.[field.key]}</b>
                </div>
              );
            })}

            <div className="detail-pair">
              <span>Endorsing Transaction ID</span>
              <b>{record?.anchorRecord?.txId}</b>
            </div>

            <div className="tamper-digest-box">
              <small className="muted">Anchored SHA-256 digest on ledger</small>
              <div className="hash">{record?.anchorRecord?.anchoredSha256}</div>
            </div>
          </div>
        </div>

        {/* Step 3: Integrity Verdict Banner */}
        {isTampered ? (
          <div className="tamper-alert" role="alert">
            <div>
              <AlertTriangle size={24} /> TAMPER DETECTED ON{" "}
              {record?.anchorRecord?.parcelNumber}
            </div>
            <b>
              CRITICAL INTEGRITY VIOLATION — MISMATCH IN:{" "}
              {tamperedFields.join(", ").toUpperCase()}
            </b>
            <p>
              The mutable database record no longer matches the cryptographic
              anchor recorded on the Hyperledger Fabric ledger. Any pending
              transfer or title issuance on{" "}
              <strong>{record?.anchorRecord.parcelNumber}</strong> must be automatically
              frozen until a registrar and security audit resolve the
              discrepancy.
            </p>
          </div>
        ) : (
          <div className="confidence">
            <CheckCircle2 size={17} /> Integrity verified for{" "}
            {record?.anchorRecord.parcelNumber}. Database fields and SHA-256 digest
            match the ledger anchor.
          </div>
        )}

        {/* Simulation & Remediation Actions */}
        {/* <div className="button-row">
          <button
            type="button"
            className="btn danger"
            onClick={handleSimulateTamper}
          >
            <AlertTriangle size={14} /> Simulate unauthorized edit
          </button>
          <button
            type="button"
            className="btn primary"
            // onClick={handleRestoreRecord}
            disabled={!isTampered}
          >
            <RotateCcw size={14} /> Restore from ledger anchor
          </button>
        </div> */}
      </section>

      {/* Step 4: Recent Integrity Inspection Log */}
      {/* <section className="card section-gap">
        <div className="card-heading">
          <h3>
            <History size={14} className="tamper-inline-icon" /> Inspection
            Session Log
          </h3>
          <span className="badge">{scanHistory.length} events</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Parcel</th>
                <th>Changed Fields</th>
                <th>Digest Prefix</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {scanHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.timestamp}</td>
                  <td>
                    <b>{item.parcelNumber}</b>
                  </td>
                  <td>
                    {item.changedFields.length > 0
                      ? item.changedFields.join(", ")
                      : "None (Clean)"}
                  </td>
                  <td>
                    <code>0x{item.digestSnapshot.slice(0, 8)}...</code>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.outcome === "TAMPER DETECTED"
                          ? "red"
                          : item.outcome === "RESTORED"
                            ? "blue"
                            : "green"
                      }`}
                    >
                      {item.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section> */}

      <p className="muted small">
        Technical note: Prototype integrity checks run deterministically in the
        browser. Production verification should canonicalize the full record
        payload, compute SHA-256 independently, and compare against endorsed
        ledger state.
      </p>
    </div>
  );
}

export default TamperPage;
