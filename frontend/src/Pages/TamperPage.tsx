import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSearch,
  History,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

interface ParcelIntegrityRecord {
  parcelNumber: string
  owner: string
  size: string
  county: string
  registrationArea: string
  tenure: 'Freehold' | 'Leasehold'
  titleVersion: string
  lastVerified: string
  anchoredSha256: string
  txId: string
}

interface TamperAuditLogEntry {
  id: string
  timestamp: string
  parcelNumber: string
  outcome: 'VERIFIED' | 'TAMPER DETECTED' | 'RESTORED'
  changedFields: string[]
  digestSnapshot: string
}

export interface TamperDetectionPageProps {
  initialParcelNumber?: string
  onParcelSelected?: (parcelNumber: string) => void
}

const LEDGER_PARCELS: Record<string, ParcelIntegrityRecord> = {
  'KJD/LOI/4581': {
    parcelNumber: 'KJD/LOI/4581',
    owner: 'Mary Wanjiku Kamau',
    size: '0.045 Ha',
    county: 'Kajiado',
    registrationArea: 'Loitokitok',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    lastVerified: '20 Nov 2026 · 10:15',
    anchoredSha256: '7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f',
    txId: '0x7a31...b90e',
  },
  'KJD/LOI/4590': {
    parcelNumber: 'KJD/LOI/4590',
    owner: 'Mary Wanjiku Kamau',
    size: '0.080 Ha',
    county: 'Kajiado',
    registrationArea: 'Loitokitok',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    lastVerified: '20 Nov 2026 · 09:40',
    anchoredSha256: '92d0a4b7e1f3c5896a2b4d6e8f0192837465564738291a0b2c3d4e5f6a7b8c9d',
    txId: '0x92d0...3e61',
  },
  'NAI/BLK/0912': {
    parcelNumber: 'NAI/BLK/0912',
    owner: 'Samuel Kiprop Cheruiyot',
    size: '0.120 Ha',
    county: 'Nairobi',
    registrationArea: 'Westlands',
    tenure: 'Leasehold',
    titleVersion: 'Version 2',
    lastVerified: '19 Nov 2026 · 16:05',
    anchoredSha256: '4f8b2c10d9e8f7a6b5c4d3e2f1a09b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a',
    txId: '0x4f8b...2c10',
  },
  'NYR/KGN/1104': {
    parcelNumber: 'NYR/KGN/1104',
    owner: 'Josephine Wambui Wachira',
    size: '0.310 Ha',
    county: 'Nyeri',
    registrationArea: 'Kieni',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    lastVerified: '20 Nov 2026 · 08:52',
    anchoredSha256: '3b92e12a8c4f1092837465afbecd0192837465fabcde0123456789abcdef0123',
    txId: '0x3b92...e12a',
  },
}

const MUTABLE_FIELDS: Array<{
  key: 'owner' | 'size' | 'county' | 'tenure'
  label: string
  expectedLabel: string
}> = [
  { key: 'owner', label: 'Registered proprietor', expectedLabel: 'Expected proprietor' },
  { key: 'size', label: 'Parcel size', expectedLabel: 'Expected parcel size' },
  { key: 'county', label: 'County', expectedLabel: 'Expected county' },
  { key: 'tenure', label: 'Tenure', expectedLabel: 'Expected tenure' },
]

function computeCanonicalDigest(record: {
  parcelNumber: string
  owner: string
  size: string
  county: string
  tenure: string
  titleVersion: string
}): string {
  const canonical = [
    record.parcelNumber.trim().toUpperCase(),
    record.owner.trim(),
    record.size.trim(),
    record.county.trim(),
    record.tenure.trim(),
    record.titleVersion.trim(),
  ].join('|')

  let h1 = 0x9e3779b9
  let h2 = 0x85ebca6b
  for (let i = 0; i < canonical.length; i++) {
    const ch = canonical.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2246822519)
    h2 = Math.imul(h2 ^ ch, 3266489917)
  }
  const partA = (h1 >>> 0).toString(16).padStart(8, '0')
  const partB = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${partA}${partB}${partB.split('').reverse().join('')}${partA.split('').reverse().join('')}`.repeat(2)
}

export function TamperPage({
  initialParcelNumber = 'KJD/LOI/4581',
  onParcelSelected,
}: TamperDetectionPageProps) {
  const normalizedInitial = initialParcelNumber.trim().toUpperCase()
  const initialAnchor = LEDGER_PARCELS[normalizedInitial] ?? LEDGER_PARCELS['KJD/LOI/4581']

  const [searchQuery, setSearchQuery] = useState(initialAnchor.parcelNumber)
  const [searchError, setSearchError] = useState('')
  const [activeParcelNumber, setActiveParcelNumber] = useState<string>(initialAnchor.parcelNumber)

  // Map of parcelNumber -> mutable database values (owner, size, county, tenure)
  const [dbOverrides, setDbOverrides] = useState<
    Record<string, { owner: string; size: string; county: string; tenure: 'Freehold' | 'Leasehold' }>
  >({})

  const [scanHistory, setScanHistory] = useState<TamperAuditLogEntry[]>([
    {
      id: 'scan-init-1',
      timestamp: 'Today · 10:15',
      parcelNumber: initialAnchor.parcelNumber,
      outcome: 'VERIFIED',
      changedFields: [],
      digestSnapshot: initialAnchor.anchoredSha256,
    },
  ])

  const anchorRecord = LEDGER_PARCELS[activeParcelNumber] ?? LEDGER_PARCELS['KJD/LOI/4581']

  const currentDbValues = useMemo(() => {
    const override = dbOverrides[anchorRecord.parcelNumber]
    return {
      owner: override?.owner ?? anchorRecord.owner,
      size: override?.size ?? anchorRecord.size,
      county: override?.county ?? anchorRecord.county,
      tenure: override?.tenure ?? anchorRecord.tenure,
    }
  }, [anchorRecord, dbOverrides])

  const tamperedFields = useMemo(() => {
    const diffs: string[] = []
    if (currentDbValues.owner.trim() !== anchorRecord.owner) diffs.push('Registered proprietor')
    if (currentDbValues.size.trim() !== anchorRecord.size) diffs.push('Parcel size')
    if (currentDbValues.county.trim() !== anchorRecord.county) diffs.push('County')
    if (currentDbValues.tenure !== anchorRecord.tenure) diffs.push('Tenure')
    return diffs
  }, [anchorRecord, currentDbValues])

  const isTampered = tamperedFields.length > 0

  const computedDbDigest = useMemo(
    () =>
      computeCanonicalDigest({
        parcelNumber: anchorRecord.parcelNumber,
        owner: currentDbValues.owner,
        size: currentDbValues.size,
        county: currentDbValues.county,
        tenure: currentDbValues.tenure,
        titleVersion: anchorRecord.titleVersion,
      }),
    [anchorRecord, currentDbValues]
  )

  const recordScanEvent = (
    parcelNum: string,
    outcome: TamperAuditLogEntry['outcome'],
    changed: string[],
    digest: string
  ) => {
    const nowLabel = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    })
    setScanHistory(prev => [
      {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: `Today · ${nowLabel}`,
        parcelNumber: parcelNum,
        outcome,
        changedFields: changed,
        digestSnapshot: digest,
      },
      ...prev.slice(0, 7),
    ])
  }

  const selectParcel = (rawQuery: string) => {
    const code = rawQuery.trim().toUpperCase()
    if (!code) {
      setSearchError('Enter a parcel or title number to run an integrity inspection.')
      return
    }
    const match = LEDGER_PARCELS[code]
    if (!match) {
      setSearchError(
        `Parcel "${code}" was not found in the ledger index. Try KJD/LOI/4581, KJD/LOI/4590, NAI/BLK/0912, or NYR/KGN/1104.`
      )
      return
    }
    setSearchError('')
    setSearchQuery(match.parcelNumber)
    setActiveParcelNumber(match.parcelNumber)
    onParcelSelected?.(match.parcelNumber)

    const ov = dbOverrides[match.parcelNumber]
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
  }

  const handleFieldChange = (key: 'owner' | 'size' | 'county' | 'tenure', value: string) => {
    setDbOverrides(prev => ({
      ...prev,
      [anchorRecord.parcelNumber]: {
        owner: prev[anchorRecord.parcelNumber]?.owner ?? anchorRecord.owner,
        size: prev[anchorRecord.parcelNumber]?.size ?? anchorRecord.size,
        county: prev[anchorRecord.parcelNumber]?.county ?? anchorRecord.county,
        tenure: prev[anchorRecord.parcelNumber]?.tenure ?? anchorRecord.tenure,
        [key]: value,
      },
    }))
  }

  const handleSimulateTamper = () => {
    const tamperedOwner = `${anchorRecord.owner.split(' ')[0]} Otieno (UNAUTHORIZED EDIT)`
    const nextDb = {
      ...currentDbValues,
      owner: tamperedOwner,
    }
    setDbOverrides(prev => ({
      ...prev,
      [anchorRecord.parcelNumber]: nextDb,
    }))
    const nextDigest = computeCanonicalDigest({
      parcelNumber: anchorRecord.parcelNumber,
      owner: nextDb.owner,
      size: nextDb.size,
      county: nextDb.county,
      tenure: nextDb.tenure,
      titleVersion: anchorRecord.titleVersion,
    })
    recordScanEvent(
      anchorRecord.parcelNumber,
      'TAMPER DETECTED',
      ['Registered proprietor'],
      nextDigest
    )
  }

  const handleRestoreRecord = () => {
    setDbOverrides(prev => {
      const copy = { ...prev }
      delete copy[anchorRecord.parcelNumber]
      return copy
    })
    recordScanEvent(
      anchorRecord.parcelNumber,
      'RESTORED',
      [],
      anchorRecord.anchoredSha256
    )
  }

  return (
    <div className="tamper-rework-page">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h1>Tamper Detection &amp; Integrity Inspector</h1>
          <p>
            Search any registered parcel, compare mutable registry fields against the Hyperledger Fabric anchor, and
            test unauthorized modification alerts.
          </p>
        </div>
        <span className={`badge ${isTampered ? 'red' : 'green'}`}>
          {isTampered ? (
            <>
              <ShieldAlert size={13} /> Integrity Violation ({tamperedFields.length} field{tamperedFields.length > 1 ? 's' : ''})
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
            <FileSearch size={15} className="tamper-inline-icon" /> Step 1: Select Parcel to Inspect
          </h3>
          <span className="badge blue">Active Target: {anchorRecord.parcelNumber}</span>
        </div>

        <label className="field-label" htmlFor="tamper-parcel-search">
          Search parcel number / title reference
        </label>
        <div className="search-row">
          <input
            id="tamper-parcel-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                selectParcel(searchQuery)
              }
            }}
            placeholder="e.g. KJD/LOI/4581 or NYR/KGN/1104"
          />
          <button type="button" className="btn primary" onClick={() => selectParcel(searchQuery)}>
            <Search size={14} /> Run integrity check
          </button>
        </div>

        <div className="tamper-quick-chips">
          <span className="muted">Indexed parcels:</span>
          {Object.keys(LEDGER_PARCELS).map(code => {
            const hasDiff = Boolean(dbOverrides[code])
            return (
              <button
                key={code}
                type="button"
                className={`tamper-chip ${activeParcelNumber === code ? 'selected' : ''} ${hasDiff ? 'dirty' : ''}`}
                onClick={() => selectParcel(code)}
              >
                <span>{code}</span>
                {hasDiff && <AlertTriangle size={12} />}
              </button>
            )
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
            <h3>Step 2: Live Database vs. Blockchain Anchor ({anchorRecord.parcelNumber})</h3>
            <small className="muted">
              {anchorRecord.registrationArea} · {anchorRecord.titleVersion} · Last verified {anchorRecord.lastVerified}
            </small>
          </div>
          <span className={`badge ${isTampered ? 'red' : 'green'}`}>
            {isTampered ? '⚠ Mismatch detected' : '● Records match'}
          </span>
        </div>

        <div className="two-col section-gap align-start">
          {/* Mutable Database Column */}
          <div className="tamper-pane">
            <div className="card-heading">
              <h3>
                <Database size={14} className="tamper-inline-icon" /> Registry Database Record
              </h3>
              <span className="badge blue">Mutable</span>
            </div>

            {MUTABLE_FIELDS.map(field => {
              const fieldChanged = currentDbValues[field.key].trim() !== anchorRecord[field.key]
              return (
                <div key={field.key}>
                  <label className="field-label" htmlFor={`tamper-field-${field.key}`}>
                    {field.label}{' '}
                    {fieldChanged && <span className="tamper-field-flag">· Modified</span>}
                  </label>
                  {field.key === 'tenure' ? (
                    <select
                      id={`tamper-field-${field.key}`}
                      className={`text-input ${fieldChanged ? 'tamper-input-alert' : ''}`}
                      value={currentDbValues.tenure}
                      onChange={e => handleFieldChange('tenure', e.target.value)}
                    >
                      <option value="Freehold">Freehold</option>
                      <option value="Leasehold">Leasehold</option>
                    </select>
                  ) : (
                    <input
                      id={`tamper-field-${field.key}`}
                      className={`text-input ${fieldChanged ? 'tamper-input-alert' : ''}`}
                      value={currentDbValues[field.key]}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              )
            })}

            <div className="tamper-digest-box">
              <small className="muted">Computed live record digest</small>
              <div className="hash">{isTampered ? computedDbDigest : anchorRecord.anchoredSha256}</div>
            </div>
          </div>

          {/* Immutable Blockchain Anchor Column */}
          <div className="tamper-pane tamper-anchor-pane">
            <div className="card-heading">
              <h3>
                <ShieldCheck size={14} className="tamper-inline-icon" /> Hyperledger Fabric Anchor
              </h3>
              <span className="badge green">Immutable reference</span>
            </div>

            {MUTABLE_FIELDS.map(field => {
              const fieldChanged = currentDbValues[field.key].trim() !== anchorRecord[field.key]
              return (
                <div className={`anchor-field ${fieldChanged ? 'tamper-anchor-diff' : ''}`} key={field.key}>
                  <small>{field.expectedLabel}</small>
                  <b>{anchorRecord[field.key]}</b>
                </div>
              )
            })}

            <div className="detail-pair">
              <span>Endorsing Transaction ID</span>
              <b>{anchorRecord.txId}</b>
            </div>

            <div className="tamper-digest-box">
              <small className="muted">Anchored SHA-256 digest on ledger</small>
              <div className="hash">{anchorRecord.anchoredSha256}</div>
            </div>
          </div>
        </div>

        {/* Step 3: Integrity Verdict Banner */}
        {isTampered ? (
          <div className="tamper-alert" role="alert">
            <div>
              <AlertTriangle size={24} /> TAMPER DETECTED ON {anchorRecord.parcelNumber}
            </div>
            <b>
              CRITICAL INTEGRITY VIOLATION — MISMATCH IN: {tamperedFields.join(', ').toUpperCase()}
            </b>
            <p>
              The mutable database record no longer matches the cryptographic anchor recorded on the Hyperledger
              Fabric ledger. Any pending transfer or title issuance on <strong>{anchorRecord.parcelNumber}</strong> must
              be automatically frozen until a registrar and security audit resolve the discrepancy.
            </p>
          </div>
        ) : (
          <div className="confidence">
            <CheckCircle2 size={17} /> Integrity verified for {anchorRecord.parcelNumber}. Database fields and SHA-256
            digest match the ledger anchor.
          </div>
        )}

        {/* Simulation & Remediation Actions */}
        <div className="button-row">
          <button type="button" className="btn danger" onClick={handleSimulateTamper}>
            <AlertTriangle size={14} /> Simulate unauthorized edit
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleRestoreRecord}
            disabled={!isTampered}
          >
            <RotateCcw size={14} /> Restore from ledger anchor
          </button>
        </div>
      </section>

      {/* Step 4: Recent Integrity Inspection Log */}
      <section className="card section-gap">
        <div className="card-heading">
          <h3>
            <History size={14} className="tamper-inline-icon" /> Inspection Session Log
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
              {scanHistory.map(item => (
                <tr key={item.id}>
                  <td>{item.timestamp}</td>
                  <td>
                    <b>{item.parcelNumber}</b>
                  </td>
                  <td>{item.changedFields.length > 0 ? item.changedFields.join(', ') : 'None (Clean)'}</td>
                  <td>
                    <code>0x{item.digestSnapshot.slice(0, 8)}...</code>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.outcome === 'TAMPER DETECTED'
                          ? 'red'
                          : item.outcome === 'RESTORED'
                            ? 'blue'
                            : 'green'
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
      </section>

      <p className="muted small">
        Technical note: Prototype integrity checks run deterministically in the browser. Production verification should
        canonicalize the full record payload, compute SHA-256 independently, and compare against endorsed ledger state.
      </p>
    </div>
  )
}

export default TamperPage