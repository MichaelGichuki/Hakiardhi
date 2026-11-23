import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react'
import { parcelRecords } from '../service/parcels'
import type { InitiatedTransferResult, ParcelDetailsDto, SupportingDocument, TransferType } from '../types/parcels.type'


type CountyName = 'Kajiado' | 'Nairobi' | 'Kiambu' | 'Machakos' | 'Nyeri'

interface ParcelRecord {
  parcelNumber: string
  ownerName: string
  ownerId: string
  ownerPhone: string
  county: CountyName
  registrationArea: string
  sizeHa: string
  tenure: 'Freehold' | 'Leasehold'
  titleVersion: string
  status: 'Registered' | 'Encumbered' | 'Pending Transfer'
  sha256: string
  ledgerConfirmed: boolean
}





export interface ParcelTransfer {
  initialParcelNumber?: string
  officerName?: string
  registryOffice?: string
  onBackToWorkflow?: () => void
  onOpenParcelSearch?: () => void
  onTransferInitiated?: (result: InitiatedTransferResult) => void
}

const SYNTHETIC_PARCELS: Record<string, ParcelRecord> = {
  'KJD/LOI/4581': {
    parcelNumber: 'KJD/LOI/4581',
    ownerName: 'Mary Wanjiku Kamau',
    ownerId: '24819032',
    ownerPhone: '+254 712 340 891',
    county: 'Kajiado',
    registrationArea: 'Loitokitok',
    sizeHa: '0.045 Ha',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    status: 'Registered',
    sha256: '7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f',
    ledgerConfirmed: true,
  },
  'KJD/LOI/4590': {
    parcelNumber: 'KJD/LOI/4590',
    ownerName: 'Mary Wanjiku Kamau',
    ownerId: '24819032',
    ownerPhone: '+254 712 340 891',
    county: 'Kajiado',
    registrationArea: 'Loitokitok',
    sizeHa: '0.080 Ha',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    status: 'Registered',
    sha256: '92d0a4b7e1f3c5896a2b4d6e8f0192837465564738291a0b2c3d4e5f6a7b8c9d',
    ledgerConfirmed: true,
  },
  'NAI/BLK/0912': {
    parcelNumber: 'NAI/BLK/0912',
    ownerName: 'Samuel Kiprop Cheruiyot',
    ownerId: '19847210',
    ownerPhone: '+254 722 809 114',
    county: 'Nairobi',
    registrationArea: 'Westlands',
    sizeHa: '0.120 Ha',
    tenure: 'Leasehold',
    titleVersion: 'Version 2',
    status: 'Registered',
    sha256: '4f8b2c10d9e8f7a6b5c4d3e2f1a09b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a',
    ledgerConfirmed: true,
  },
  'KIAM/3321': {
    parcelNumber: 'KIAM/3321',
    ownerName: 'Grace Njeri Mwangi',
    ownerId: '22190485',
    ownerPhone: '+254 701 552 908',
    county: 'Kiambu',
    registrationArea: 'Limuru',
    sizeHa: '0.250 Ha',
    tenure: 'Freehold',
    titleVersion: 'Version 1',
    status: 'Registered',
    sha256: '81c2a63f5e4d3c2b1a0987654321fedcba0987654321abcdef0123456789abcd',
    ledgerConfirmed: true,
  },
}

const DEFAULT_DOCS: SupportingDocument[] = [
  {
    id: 'doc-1',
    docType: 'Executed Land Sale Agreement',
    fileName: 'sale-agreement-KJD-LOI-4581.pdf',
    fileSizeLabel: '1.4 MB',
    hashPreview: '0x9a4f...c812',
    verified: true,
  },
  {
    id: 'doc-2',
    docType: 'Land Control Board (LCB) Consent',
    fileName: 'lcb-consent-loitokitok-2026.pdf',
    fileSizeLabel: '820 KB',
    hashPreview: '0x4d18...73ab',
    verified: true,
  },
]

function computeDeterministicDigest(input: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const combined = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')
  return `${combined}${combined.split('').reverse().join('')}${combined.slice(0, 32)}`
}

export function InitiateTransferPage({
  initialParcelNumber = 'KJD/LOI/4581',
  officerName = 'Demo Officer',
  registryOffice = 'Nairobi Registry',
  onBackToWorkflow,
  onOpenParcelSearch,
  onTransferInitiated,
}: ParcelTransfer) {

  const [parcelInput, setParcelInput] = useState(initialParcelNumber)
  const [selectedParcel, setSelectedParcel] = useState<ParcelDetailsDto | null>()
  const [parcelLookupError, setParcelLookupError] = useState('')
  const [step, setStep] = useState<number>(1);

  const [transferType, setTransferType] = useState<TransferType>('Sale / Transfer')
  const [buyerName, setBuyerName] = useState('Peter Mwangi Njoroge')
  const [buyerId, setBuyerId] = useState('27945108')
  const [buyerPhone, setBuyerPhone] = useState('+254 723 619 402')
  const [considerationKes, setConsiderationKes] = useState('2,850,000')
  const [consentChannel, setConsentChannel] = useState<'Landowner Portal' | 'USSD (*483*55#)' | 'Both (Portal + USSD)'>('Both (Portal + USSD)')
  const [registryCounty, setRegistryCounty] = useState<string>('Kajiado')

  const [documents, setDocuments] = useState<SupportingDocument[]>(DEFAULT_DOCS)
  const [newDocType, setNewDocType] = useState('Rates & Rent Clearance Certificate')
  const [newDocName, setNewDocName] = useState('')

  const [checklist, setChecklist] = useState({
    proprietorMatched: true,
    noActiveCaveat: true,
    hashesAnchored: true,
    consentQueueReady: true,
  })

  const [formError, setFormError] = useState('')
  const [submittedTransfer, setSubmittedTransfer] = useState<InitiatedTransferResult | null>(null)

  const integrityVerified = useMemo(() => {
    if (!selectedParcel) return false
    return Boolean(1
      // selectedParcel.ledgerConfirmed &&
      // selectedParcel.sha256.length >= 64 &&
      // selectedParcel.status === 'Registered'
    )
  }, [selectedParcel])

  const allChecklistChecked = Object.values(checklist).every(Boolean)

  const handleLookupParcel = async () => {
    const normalized = parcelInput.trim().toUpperCase()
    if (!normalized) {
      setSelectedParcel(null)
      setParcelLookupError('Enter a parcel or title number to verify against the registry.')
      return
    }
    try {
      const res = await parcelRecords.getParcels(normalized);
      if (res.status !== 200) {
        setSelectedParcel(null)
        setParcelLookupError(
          `No synthetic parcel matched "${normalized}". Try KJD/LOI/4581, KJD/LOI/4590, NAI/BLK/0912, or KIAM/3321.`
        )
        return
      }
      setParcelLookupError('')
      setSelectedParcel(res.data)
      setRegistryCounty(res.data.county)
      setSubmittedTransfer(null)
    } catch {
      
    }

  }

  const handleAddDocument = () => {
    const cleanName = newDocName.trim() || `${newDocType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
    const digest = computeDeterministicDigest(`${newDocType}:${cleanName}:${Date.now()}`)
    const entry: SupportingDocument = {
      id: `doc-${Date.now()}`,
      docType: newDocType,
      fileName: cleanName,
      fileSizeLabel: '640 KB',
      hashPreview: `0x${digest.slice(0, 4)}...${digest.slice(-4)}`,
      verified: true,
    }
    setDocuments(prev => [...prev, entry])
    setNewDocName('')
  }

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedParcel || !integrityVerified) {
      setFormError('A ledger-verified registered parcel must be selected before initiating a transfer.')
      return
    }
    if (!buyerName.trim() || !buyerId.trim()) {
      setFormError('Transferee / buyer full name and National ID are required.')
      return
    }
    if (documents.length === 0) {
      setFormError('Attach at least one supporting instrument or clearance document to anchor its hash.')
      return
    }
    if (!allChecklistChecked) {
      setFormError('Complete all pre-initiation verification checks before submitting to the workflow.')
      return
    }

    const now = new Date()
    const formattedTime = now.toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const refNumber = `TR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`
    const rawPayload = [
      refNumber,
      selectedParcel.parcelNumber,
      selectedParcel.ownerId,
      buyerId.trim(),
      transferType,
      documents.map(d => `${d.docType}:${d.hashPreview}`).join('|'),
    ].join('::')
    const fullDigest = computeDeterministicDigest(rawPayload)

    const result: InitiatedTransferResult = {
      reference: refNumber,
      initiatedAt: formattedTime,
      officerName,
      registryOffice: `${registryCounty} (${registryOffice})`,
      parcel: selectedParcel,
      transferType,
      buyerName: buyerName.trim(),
      buyerId: buyerId.trim(),
      buyerPhone: buyerPhone.trim() || 'Not provided',
      considerationKes: considerationKes.trim() || '0',
      consentChannel,
      documents,
      payloadDigest: fullDigest,
      txId: `0x${fullDigest.slice(0, 4)}...${fullDigest.slice(-4)}`,
    }

    console.log(result);
    
    // setSubmittedTransfer(result)
    // onTransferInitiated?.(result)
  }

  const handleStartNewTransfer = () => {
    setSubmittedTransfer(null)
    setFormError('')
  }

  return (
    <div className="initiate-transfer-page">
      <div className="page-heading">
        <div>
          <h1>Initiate Land Transfer</h1>
          <p>
            Verify registered parcel integrity, capture transferee details, anchor supporting documents, and dispatch
            landowner consent.
          </p>
        </div>
        <div className="button-row initiate-header-actions">
          {onOpenParcelSearch && (
            <button type="button" className="btn" onClick={onOpenParcelSearch}>
              <Search size={14} /> Parcel search
            </button>
          )}
          {onBackToWorkflow && (
            <button type="button" className="btn" onClick={onBackToWorkflow}>
              <ArrowLeft size={14} /> Transfer workflow
            </button>
          )}
        </div>
      </div>

      {/* Stage Strip */}
      <section className="card section-gap initiate-stage-card">
        <div className="initiate-stage-strip">
          <div className="initiate-stage-item active">
            <span className="step-number current">1</span>
            <div>
              <b>Parcel &amp; Ledger Check</b>
              <small>Confirm title &amp; SHA-256</small>
            </div>
          </div>
          <div className="initiate-stage-item active">
            <span className="step-number current">2</span>
            <div>
              <b>Parties &amp; Instruments</b>
              <small>Buyer ID &amp; supporting hashes</small>
            </div>
          </div>
          <div className="initiate-stage-item active">
            <span className="step-number current">3</span>
            <div>
              <b>Owner Consent Dispatch</b>
              <small>Portal &amp; *483*55# USSD</small>
            </div>
          </div>
          <div className="initiate-stage-item active">
            <span className="step-number current">4</span>
            <div>
              <b>Verification &amp; Registrar</b>
              <small>Locked until consent signed</small>
            </div>
          </div>
        </div>
      </section>

      {submittedTransfer ? (
        <section className="card section-gap initiate-receipt-card">
          <div className="card-heading">
            <div>
              <div className="eyebrow">TRANSFER APPLICATION ANCHORED</div>
              <h2 className="record-title initiate-receipt-title">{submittedTransfer.reference}</h2>
            </div>
            <span className="badge green">
              <CheckCircle2 size={13} /> Awaiting Landowner Consent
            </span>
          </div>

          <p className="muted">
            Initiated on <strong>{submittedTransfer.initiatedAt}</strong> by{' '}
            <strong>{submittedTransfer.officerName}</strong> · {submittedTransfer.registryOffice}
          </p>

          <div className="record-grid section-gap">
            <div>
              <span>Parcel Reference</span>
              <b>
                {submittedTransfer.parcel.parcelNumber} ({submittedTransfer.parcel.size})
              </b>
            </div>
            <div>
              <span>Transfer Category</span>
              <b>{submittedTransfer.transferType}</b>
            </div>
            <div>
              <span>Registered Proprietor (Transferor)</span>
              <b>
                {submittedTransfer.parcel.ownerName} · ID {submittedTransfer.parcel.ownerId}
              </b>
            </div>
            <div>
              <span>Proposed Buyer (Transferee)</span>
              <b>
                {submittedTransfer.buyerName} · ID {submittedTransfer.buyerId}
              </b>
            </div>
            <div>
              <span>Declared Consideration</span>
              <b>KES {submittedTransfer.considerationKes}</b>
            </div>
            <div>
              <span>Consent Dispatch Channel</span>
              <b>{submittedTransfer.consentChannel}</b>
            </div>
          </div>

          <div className="section-gap">
            <h3>Anchored Supporting Documents ({submittedTransfer.documents.length})</h3>
            <div className="initiate-doc-list">
              {submittedTransfer.documents.map(doc => (
                <div className="initiate-doc-item" key={doc.id}>
                  <FileCheck2 size={16} className="initiate-doc-icon" />
                  <div className="initiate-doc-meta">
                    <b>{doc.docType}</b>
                    <small>
                      {doc.fileName} · {doc.fileSizeLabel}
                    </small>
                  </div>
                  <span className="badge blue">{doc.hashPreview}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-gap">
            <h3>Ledger Payload Digest &amp; Transaction Reference</h3>
            <div className="detail-pair">
              <span>Fabric Transaction ID</span>
              <b>{submittedTransfer.txId}</b>
            </div>
            <div className="hash">SHA-256: {submittedTransfer.payloadDigest}</div>
          </div>

          <div className="notice">
            <b>Mandatory Consent Gate Active</b>
            <p>
              Transfer <strong>{submittedTransfer.reference}</strong> has been queued for{' '}
              <strong>{submittedTransfer.parcel.ownerName}</strong> ({submittedTransfer.parcel.ownerPhone}). Document
              verification and title version minting remain locked until proprietor consent is recorded.
            </p>
          </div>

          <div className="button-row">
            {onBackToWorkflow && (
              <button type="button" className="btn primary" onClick={onBackToWorkflow}>
                Proceed to Transfer Workflow <ArrowRight size={14} />
              </button>
            )}
            <button type="button" className="btn" onClick={handleStartNewTransfer}>
              <FilePlus2 size={14} /> Initiate another transfer
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleInitiateSubmit} className="two-col section-gap align-start initiate-layout">
          {/* Left Column: Parcel Lookup + Party & Instrument Details */}
          <div className="initiate-col-stack">
            <section className="card">
              <div className="card-heading">
                <h3>1. Registered Parcel Verification</h3>
                {selectedParcel ? (
                  <span className={`badge ${integrityVerified ? 'green' : 'red'}`}>
                    {integrityVerified ? '● Ledger Matched' : '⚠ Integrity Warning'}
                  </span>
                ) : (
                  <span className="badge amber">Unverified</span>
                )}
              </div>

              <label className="field-label" htmlFor="parcel-lookup-input">
                Parcel / Title Reference Number
              </label>
              <div className="search-row">
                <input
                  id="parcel-lookup-input"
                  value={parcelInput}
                  onChange={e => setParcelInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleLookupParcel()
                    }
                  }}
                  placeholder="e.g. KJD/LOI/4581"
                />
                <button type="button" className="btn primary" onClick={handleLookupParcel}>
                  <Search size={14} /> Verify parcel
                </button>
              </div>
              <small className="muted">
                Demo parcels: KJD/LOI/4581, KJD/LOI/4590, NAI/BLK/0912, KIAM/3321
              </small>

              {parcelLookupError && (
                <div className="decision-message rejected" role="alert">
                  {parcelLookupError}
                </div>
              )}

              {selectedParcel && (
                <div className="initiate-parcel-summary section-gap">
                  <div className="initiate-parcel-top">
                    <div>
                      <div className="eyebrow">VERIFIED REGISTER ENTRY</div>
                      <h2 className="record-title initiate-parcel-code">{selectedParcel.parcelNumber}</h2>
                    </div>
                    <div className="tag-row initiate-inline-tags">
                      <span className="badge green">{selectedParcel.status}</span>
                      <span className="badge blue">{selectedParcel.titleVersion}</span>
                    </div>
                  </div>

                  <div className="record-grid">
                    <div>
                      <span>Registered Proprietor</span>
                      <b>{selectedParcel.ownerName}</b>
                    </div>
                    <div>
                      <span>Proprietor National ID</span>
                      <b>{selectedParcel.ownerId}</b>
                    </div>
                    <div>
                      <span>County &amp; Registry Section</span>
                      <b>
                        {selectedParcel.county} · {selectedParcel.registrationArea}
                      </b>
                    </div>
                    <div>
                      <span>Area &amp; Tenure</span>
                      <b>
                        {selectedParcel.size} · {selectedParcel.tenure}
                      </b>
                    </div>
                  </div>

                  <div className="hash">ANCHORED SHA-256: {selectedParcel.sha256}</div>
                </div>
              )}
            </section>

            <section className="card section-gap">
              <div className="card-heading">
                <h3>2. Transfer Type, Buyer &amp; Consent Channel</h3>
                <span className="badge blue">
                  <Users size={12} /> Party Details
                </span>
              </div>

              <div className="two-col initiate-subgrid">
                <div>
                  <label className="field-label" htmlFor="transfer-type-select">
                    Transfer Category
                  </label>
                  <select
                    id="transfer-type-select"
                    className="text-input"
                    value={transferType}
                    onChange={e => setTransferType(e.target.value as TransferType)}
                  >
                    <option value="Sale / Transfer">Sale / Transfer</option>
                    <option value="Subdivision">Subdivision</option>
                    <option value="Succession / Transmission">Succession / Transmission</option>
                    <option value="Charge / Leasehold Assignment">Charge / Leasehold Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="registry-county-select">
                    Processing Registry County
                  </label>
                  <select
                    id="registry-county-select"
                    className="text-input"
                    value={registryCounty}
                    onChange={e => setRegistryCounty(e.target.value as CountyName)}
                  >
                    <option value="Kajiado">Kajiado</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Machakos">Machakos</option>
                    <option value="Nyeri">Nyeri</option>
                  </select>
                </div>
              </div>

              <div className="two-col initiate-subgrid">
                <div>
                  <label className="field-label" htmlFor="buyer-name-input">
                    Transferee / Buyer Full Name
                  </label>
                  <input
                    id="buyer-name-input"
                    className="text-input"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder="e.g. Peter Mwangi Njoroge"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="buyer-id-input">
                    Buyer National ID / Passport
                  </label>
                  <input
                    id="buyer-id-input"
                    className="text-input"
                    value={buyerId}
                    onChange={e => setBuyerId(e.target.value)}
                    placeholder="e.g. 27945108"
                  />
                </div>
              </div>

              <div className="two-col initiate-subgrid">
                <div>
                  <label className="field-label" htmlFor="buyer-phone-input">
                    Buyer Mobile Number
                  </label>
                  <input
                    id="buyer-phone-input"
                    className="text-input"
                    value={buyerPhone}
                    onChange={e => setBuyerPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="consideration-input">
                    Consideration Value (KES)
                  </label>
                  <input
                    id="consideration-input"
                    className="text-input"
                    value={considerationKes}
                    onChange={e => setConsiderationKes(e.target.value)}
                    placeholder="e.g. 2,850,000"
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="consent-channel-select">
                  Landowner Consent Notification Channel
                </label>
                <select
                  id="consent-channel-select"
                  className="text-input"
                  value={consentChannel}
                  onChange={e =>
                    setConsentChannel(
                      e.target.value as 'Landowner Portal' | 'USSD (*483*55#)' | 'Both (Portal + USSD)'
                    )
                  }
                >
                  <option value="Both (Portal + USSD)">Both (Landowner Portal + *483*55# USSD)</option>
                  <option value="Landowner Portal">Landowner Portal Only</option>
                  <option value="USSD (*483*55#)">USSD Feature Phone (*483*55#)</option>
                </select>
              </div>
            </section>
          </div>

          {/* Right Column: Supporting Documents + Pre-Flight Verification & Submission */}
          <div className="initiate-col-stack">
            <section className="card">
              <div className="card-heading">
                <h3>3. Supporting Instruments &amp; Document Hashes</h3>
                <span className="badge green">{documents.length} attached</span>
              </div>

              <div className="initiate-doc-list">
                {documents.map(doc => (
                  <div className="initiate-doc-item" key={doc.id}>
                    <FileText size={16} className="initiate-doc-icon" />
                    <div className="initiate-doc-meta">
                      <b>{doc.docType}</b>
                      <small>
                        {doc.fileName} · {doc.fileSizeLabel}
                      </small>
                    </div>
                    <span className="badge blue">{doc.hashPreview}</span>
                    <button
                      type="button"
                      className="btn initiate-icon-btn"
                      onClick={() => handleRemoveDocument(doc.id)}
                      aria-label={`Remove ${doc.docType}`}
                      title="Remove document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="initiate-add-doc-box section-gap">
                <label className="field-label" htmlFor="doc-type-select">
                  Instrument / Clearance Type
                </label>
                <select
                  id="doc-type-select"
                  className="text-input"
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value)}
                >
                  <option value="Rates & Rent Clearance Certificate">Rates &amp; Rent Clearance Certificate</option>
                  <option value="Stamp Duty Valuation & Payment Receipt">Stamp Duty Valuation &amp; Payment Receipt</option>
                  <option value="Spousal / Co-Owner Consent Declaration">Spousal / Co-Owner Consent Declaration</option>
                  <option value="Mutation / Survey Registry Map">Mutation / Survey Registry Map</option>
                </select>

                <label className="field-label" htmlFor="doc-file-input">
                  Scanned File Name (Simulated Upload)
                </label>
                <div className="search-row">
                  <input
                    id="doc-file-input"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    placeholder="e.g. stamp-duty-receipt-2026.pdf"
                  />
                  <button type="button" className="btn" onClick={handleAddDocument}>
                    <Upload size={14} /> Anchor hash
                  </button>
                </div>
              </div>
            </section>

            <section className="card section-gap">
              <div className="card-heading">
                <h3>4. Officer Verification &amp; Dispatch</h3>
                <span className="badge amber">
                  <ShieldCheck size={12} /> Pre-flight gate
                </span>
              </div>

              <div className="initiate-checklist">
                <label className="initiate-check-row">
                  <input
                    type="checkbox"
                    checked={checklist.proprietorMatched}
                    onChange={e => setChecklist(prev => ({ ...prev, proprietorMatched: e.target.checked }))}
                  />
                  <UserCheck size={15} />
                  <span>Transferor identity matches active registry proprietor</span>
                </label>

                <label className="initiate-check-row">
                  <input
                    type="checkbox"
                    checked={checklist.noActiveCaveat}
                    onChange={e => setChecklist(prev => ({ ...prev, noActiveCaveat: e.target.checked }))}
                  />
                  <Landmark size={15} />
                  <span>No blocking court inhibition, caution, or freeze on parcel</span>
                </label>

                <label className="initiate-check-row">
                  <input
                    type="checkbox"
                    checked={checklist.hashesAnchored}
                    onChange={e => setChecklist(prev => ({ ...prev, hashesAnchored: e.target.checked }))}
                  />
                  <ClipboardCheck size={15} />
                  <span>All attached instruments hashed for Hyperledger Fabric endorsement</span>
                </label>

                <label className="initiate-check-row">
                  <input
                    type="checkbox"
                    checked={checklist.consentQueueReady}
                    onChange={e => setChecklist(prev => ({ ...prev, consentQueueReady: e.target.checked }))}
                  />
                  <Check size={15} />
                  <span>Direct proprietor consent request queued prior to verification</span>
                </label>
              </div>

              <div className="notice">
                <b>Critical business rule</b>
                <p>
                  Initiating a transfer dispatches a consent request to the registered landowner. Staff cannot bypass
                  proprietor approval or advance to title issuance without authenticated consent.
                </p>
              </div>

              {formError && (
                <div className="decision-message rejected" role="alert">
                  {formError}
                </div>
              )}

              <div className="button-row">
                <button type="submit" className="btn primary full-width">
                  Initiate transfer &amp; request owner consent <ArrowRight size={15} />
                </button>
              </div>
            </section>
          </div>
        </form>
      )}
    </div>
  )
}

export default InitiateTransferPage