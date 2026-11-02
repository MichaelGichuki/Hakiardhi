import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Blocks, Building2,
  Check, CheckCircle2, ChevronRight, ClipboardList, Clock3, FileCheck2,
  FileText, Fingerprint, Home, LayoutDashboard, LockKeyhole, LogOut,
  Menu, Search, ShieldCheck, Smartphone, UserRound, Users, X, Printer,
  RotateCcw, Database, CircleHelp, Landmark
} from 'lucide-react'

type Page = 'dashboard' | 'parcels' | 'workflow' | 'landowner' | 'ussd' | 'tamper' | 'certificate' | 'audit' | 'login'
type TransferStage = 0 | 1 | 2 | 3 | 4

const navGroups = [
  { label: 'WORKSPACE', items: [
    { id: 'dashboard' as Page, label: 'Command Center', icon: LayoutDashboard },
    { id: 'parcels' as Page, label: 'Parcel Records', icon: Search },
    { id: 'workflow' as Page, label: 'Transfer Workflow', icon: Activity },
    { id: 'landowner' as Page, label: 'Landowner Portal', icon: UserRound },
  ]},
  { label: 'SECURITY & TRUST', items: [
    { id: 'tamper' as Page, label: 'Tamper Detection', icon: ShieldCheck },
    { id: 'audit' as Page, label: 'Immutable Audit Trail', icon: ClipboardList },
    { id: 'certificate' as Page, label: 'Digital Title', icon: FileText },
  ]},
  { label: 'FIELD ACCESS', items: [
    { id: 'ussd' as Page, label: 'USSD Simulator', icon: Smartphone },
  ]},
]
const pageTitles: Record<Page, string> = {
  dashboard: 'Command Center', parcels: 'Parcel Records', workflow: 'Transfer Workflow',
  landowner: 'Landowner Portal', ussd: 'USSD Simulator', tamper: 'Tamper Detection',
  certificate: 'Digital Title', audit: 'Immutable Audit Trail', login: 'Secure Authentication',
}
const originalRecord = { owner: 'Mary Wanjiku Kamau', size: '0.045 Ha', county: 'Kajiado' }

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}
function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}
function Stat({ label, value, note, tone = 'normal' }: { label: string; value: string; note: string; tone?: 'normal' | 'good' | 'warn' }) {
  return <Card><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className={`stat-note ${tone}`}>{note}</div></Card>
}
function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [parcelQuery, setParcelQuery] = useState('KJD/LOI/4581')
  const [parcelSearched, setParcelSearched] = useState(true)
  const [stage, setStage] = useState<TransferStage>(1)
  const [ownerDecision, setOwnerDecision] = useState<'approved' | 'rejected' | null>(null)
  const [dbRecord, setDbRecord] = useState(originalRecord)
  const [auditQuery, setAuditQuery] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const tampered = Object.keys(originalRecord).some(k => dbRecord[k as keyof typeof originalRecord] !== originalRecord[k as keyof typeof originalRecord])

  const go = (next: Page) => { setPage(next); setMobileOpen(false) }
  const auditRows = [
    ['02 Nov 2026 10:42', 'Land Officer', 'Transfer initiated', 'TR-2026-0841', '0x7a31...b90e'],
    ['02 Nov 2026 10:16', 'Citizen Portal', 'Owner consent recorded', 'TR-2026-0838', '0x3b92...e12a'],
    ['02 Nov 2026 09:51', 'Verification Officer', 'Document hash anchored', 'TR-2026-0841', '0x81c2...a63f'],
    ['02 Nov 2026 09:14', 'Registrar', 'Title version approved', 'KJD/LOI/4581', '0x4f8b...2c10'],
    ['01 Nov 2026 16:28', 'Land Officer', 'Parcel record verified', 'KJD/LOI/4590', '0x92d0...3e61'],
    ['01 Nov 2026 14:03', 'Verification Officer', 'Legal document review', 'TR-2026-0836', '0xc7a1...f04b'],
  ]
  const filteredAudit = useMemo(() => auditRows.filter(row => row.join(' ').toLowerCase().includes(auditQuery.toLowerCase())), [auditQuery])

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">H</div><div><b>HakiArdhi</b><small>LAND REGISTRY</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      {navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => {
        const Icon = item.icon
        return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => go(item.id)}><Icon size={17}/><span>{item.label}</span></button>
      })}</div>)}
      <div className="sidebar-bottom"><div className="network-dot"><span/> Fabric network connected</div><small>DEMO ENVIRONMENT<br/>Kenya Land Administration</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20}/></button><div className="crumb">Republic of Kenya <span>/</span> {pageTitles[page]}</div><div className="topbar-right"><Badge tone="green">● Network online</Badge><span className="officer-name">Demo Officer</span><div className="avatar">DO</div></div></header>
      <div className="content">
        {page === 'dashboard' && <Dashboard go={go}/>}
        {page === 'parcels' && <ParcelPage query={parcelQuery} setQuery={setParcelQuery} searched={parcelSearched} setSearched={setParcelSearched}/>}
        {page === 'workflow' && <WorkflowPage stage={stage} setStage={setStage}/>}
        {page === 'landowner' && <LandownerPage decision={ownerDecision} setDecision={setOwnerDecision} go={go}/>}
        {page === 'ussd' && <UssdPage/>}
        {page === 'tamper' && <TamperPage record={dbRecord} setRecord={setDbRecord} tampered={tampered}/>}
        {page === 'certificate' && <CertificatePage/>}
        {page === 'audit' && <AuditPage query={auditQuery} setQuery={setAuditQuery} rows={filteredAudit}/>}
        {page === 'login' && <LoginPage message={loginMessage} setMessage={setLoginMessage}/>}
      </div>
      <footer className="app-footer">HAKIARDHI · NATIONAL LAND REGISTRY PROTOTYPE · SYNTHETIC DEMONSTRATION DATA</footer>
    </main>
  </div>
}

function Dashboard({ go }: { go: (p: Page) => void }) {
  return <>
    <PageHeading title="Staff Command Center" subtitle="Land administration overview · Nairobi Registry" action={<button className="btn primary" onClick={() => go('workflow')}>＋ Initiate transfer</button>}/>
    <div className="stats-grid">
      <Stat label="Pending transfers" value="24" note="↑ 4 awaiting review" tone="warn"/>
      <Stat label="Verified parcels" value="8,451" note="● Ledger verified" tone="good"/>
      <Stat label="Awaiting owner consent" value="07" note="Across 3 registries"/>
      <Stat label="Completed today" value="12" note="↑ 3 from yesterday" tone="good"/>
    </div>
    <div className="two-col section-gap">
      <Card><div className="card-heading"><h3>Transfer processing queue</h3><Badge tone="amber">Action required</Badge></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Parcel</th><th>Stage</th><th>Priority</th></tr></thead><tbody>
        <tr><td>TR-2026-0841</td><td>KJD/LOI/4581</td><td>Owner consent</td><td><Badge tone="amber">High</Badge></td></tr>
        <tr><td>TR-2026-0839</td><td>NAI/BLK/0912</td><td>Document review</td><td><Badge tone="blue">Normal</Badge></td></tr>
        <tr><td>TR-2026-0836</td><td>KIAM/3321</td><td>Registrar</td><td><Badge tone="amber">High</Badge></td></tr>
        <tr><td>TR-2026-0834</td><td>MAC/0918</td><td>Initiated</td><td><Badge tone="blue">Normal</Badge></td></tr>
      </tbody></table></div><button className="btn" onClick={() => go('workflow')}>Open workflow <ArrowRight size={14}/></button></Card>
      <Card><div className="card-heading"><h3>Blockchain network health</h3><Badge tone="green">Healthy</Badge></div><div className="health-score">99.98%</div><p className="muted">Network availability · Hyperledger Fabric</p><div className="progress"><span style={{width:'100%'}}/></div><div className="health-line"><CheckCircle2 size={15}/> All peers synchronized</div><div className="detail-pair"><span>Peer</span><b>peer0.org1.land.go.ke</b></div><div className="detail-pair"><span>Latest block</span><b>#0084512</b></div></Card>
    </div>
    <Card className="section-gap"><h3>Recent system activity</h3><ActivityRow title="Document hash anchored on ledger" meta="TR-2026-0841 · Land Officer · 10:42 AM" status="Success"/><ActivityRow title="Owner consent received" meta="TR-2026-0838 · Citizen Portal · 10:16 AM" status="Success"/><ActivityRow title="New parcel verification request" meta="KJD/LOI/4581 · 09:51 AM" status="New"/></Card>
  </>
}
function ActivityRow({ title, meta, status }: { title: string; meta: string; status: string }) {
  return <div className="activity-row"><div className="activity-icon"><Check size={15}/></div><div className="activity-copy"><b>{title}</b><small>{meta}</small></div><Badge tone={status === 'New' ? 'blue' : 'green'}>{status}</Badge></div>
}
function ParcelPage({ query, setQuery, searched, setSearched }: { query: string; setQuery: (v: string) => void; searched: boolean; setSearched: (v: boolean) => void }) {
  return <><PageHeading title="Parcel Search & Record View" subtitle="Search the land register and verify ledger integrity."/>
    <Card className="section-gap"><label className="field-label">Parcel number / title reference</label><div className="search-row"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearched(true)} placeholder="e.g. KJD/LOI/4581"/><button className="btn primary" onClick={() => setSearched(true)}><Search size={15}/> Search</button></div><small className="muted">Example: KJD/LOI/4581 · Synthetic demonstration data</small></Card>
    {searched && query.trim().toUpperCase() === 'KJD/LOI/4581' ? <div className="two-col section-gap"><Card><div className="eyebrow">REGISTERED PARCEL</div><h2 className="record-title">KJD/LOI/4581</h2><div className="record-field"><span>Registered proprietor</span><b>Mary Wanjiku Kamau</b></div><div className="record-grid"><div><span>Land size</span><b>0.045 Ha</b></div><div><span>County</span><b>Kajiado</b></div><div><span>Registration date</span><b>14 Mar 2018</b></div><div><span>Tenure</span><b>Freehold</b></div></div><div className="tag-row"><Badge tone="green">Registered</Badge><Badge tone="blue">Version 1</Badge></div></Card><Card><h3>Cryptographic Confidence</h3><p className="muted">Record integrity verification checklist</p><VerifyRow label="Database record available" result="Match"/><VerifyRow label="SHA-256 digest matches" result="Match"/><VerifyRow label="Blockchain transaction confirmed" result="Confirmed"/><VerifyRow label="Title version consistent" result="Match"/><div className="confidence">✓ HIGH CONFIDENCE — No mismatch detected</div></Card><Card className="full-span"><h3>Ledger reference</h3><div className="hash">SHA-256: 7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f</div></Card></div> : searched && <Card className="section-gap"><b>No matching synthetic record found</b><p className="muted">Try KJD/LOI/4581.</p></Card>}
  </>
}
function VerifyRow({ label, result }: { label: string; result: string }) {
  return <div className="verify-row"><CheckCircle2 size={16}/><span>{label}</span><Badge tone="green">{result}</Badge></div>
}
function WorkflowPage({ stage, setStage }: { stage: TransferStage; setStage: (v: TransferStage) => void }) {
  const steps = [
    ['Transfer Initiation', 'Land officer submits transfer application and supporting documents.'],
    ['Landowner Consent', 'Registered proprietor must personally approve or reject the transaction.'],
    ['Document Verification', 'Verification officer checks legal documents and cryptographic hashes.'],
    ['Final Registrar Approval', 'Registrar authorizes the new title version to be anchored on the ledger.'],
  ]
  return <><PageHeading title="Transfer Workflow Engine" subtitle="End-to-end controlled land ownership transfer pipeline."/>
    <Card className="section-gap"><div className="record-grid"><div><span>Transfer reference</span><b>TR-2026-0841</b></div><div><span>Parcel</span><b>KJD/LOI/4581</b></div><div><span>Current owner</span><b>Mary Wanjiku Kamau</b></div><div><span>Proposed buyer</span><b>Peter Mwangi Njoroge</b></div></div></Card>
    <Card className="section-gap"><div className="card-heading"><h3>Process completion</h3><Badge tone={stage === 4 ? 'green' : 'amber'}>{stage}/4 stages</Badge></div><div className="progress"><span style={{width:`${stage/4*100}%`}}/></div><div className="muted progress-caption">Stage {stage} of 4 · {steps[Math.min(stage-1,3)][0]}</div>
      <div className="workflow-steps">{steps.map(([title, desc], i) => <div className="workflow-step" key={title}><div className={`step-number ${i < stage ? 'complete' : i === stage ? 'current' : ''}`}>{i < stage ? <Check size={15}/> : i+1}</div><div className="step-copy"><b>{i+1}. {title}</b><small>{desc}</small></div><Badge tone={i < stage ? 'green' : i === stage ? 'amber' : 'slate'}>{i < stage ? 'Completed' : i === stage ? 'Current' : 'Locked'}</Badge></div>)}</div>
      <div className="notice"><b>Critical business rule</b><p>No transfer can proceed to verification or title issuance without authenticated, direct consent from the registered proprietor. Staff cannot override this consent requirement.</p></div>
      <div className="button-row"><button className="btn primary" disabled={stage === 4} onClick={() => setStage(Math.min(4, stage+1) as TransferStage)}>Simulate next approval <ArrowRight size={14}/></button><button className="btn" onClick={() => setStage(1)}><RotateCcw size={14}/> Reset demo</button></div>
    </Card>
  </>
}
function LandownerPage({ decision, setDecision, go }: { decision: 'approved' | 'rejected' | null; setDecision: (v: 'approved' | 'rejected' | null) => void; go: (p: Page) => void }) {
  return <><PageHeading title="Landowner Portal" subtitle="Your property. Your identity. Your authority."/>
    <Card className="profile-card section-gap"><div className="profile-avatar">MW</div><div className="profile-copy"><b>Mary Wanjiku Kamau</b><small>National ID: 2XXXXXXX · Verified citizen</small></div><Badge tone="green">Identity verified</Badge></Card>
    <div className="stats-grid"><Stat label="My properties" value="02" note="Registered parcels"/><Stat label="Incoming requests" value={decision ? '00' : '01'} note="Requires your action" tone="warn"/><Stat label="Completed transfers" value="00" note="This account"/><Stat label="Account status" value="Protected" note="Identity verified" tone="good"/></div>
    <Card className="section-gap"><h3>My registered properties</h3><div className="property-row"><div><b>KJD/LOI/4581</b><small>Loitokitok · Kajiado · 0.045 Ha</small></div><Badge tone="green">Verified</Badge><button className="btn" onClick={() => go('certificate')}>View title</button></div><div className="property-row"><div><b>KJD/LOI/4590</b><small>Loitokitok · Kajiado · 0.080 Ha</small></div><Badge tone="green">Verified</Badge><button className="btn" onClick={() => go('parcels')}>View record</button></div></Card>
    <Card className="section-gap request-card"><div className="card-heading"><h3>Incoming transfer request</h3><Badge tone={decision ? decision === 'approved' ? 'green' : 'red' : 'amber'}>{decision ? decision === 'approved' ? 'Consent confirmed' : 'Rejected' : 'Action required'}</Badge></div><h2 className="record-title">TR-2026-0841</h2><div className="record-grid"><div><span>Parcel</span><b>KJD/LOI/4581</b></div><div><span>Proposed buyer</span><b>Peter Mwangi Njoroge</b></div><div><span>Transaction</span><b>Sale / Transfer</b></div><div><span>Application date</span><b>02 Nov 2026</b></div></div><p className="muted">Review this request carefully. Approving authorizes the transfer to continue; it does not bypass legal verification or registrar approval.</p>{decision ? <div className={`decision-message ${decision}`}>{decision === 'approved' ? '✓ Consent confirmed in this demo. The request can proceed to document verification.' : '✕ Transfer rejected. The workflow is stopped; no title version can be minted.'}</div> : <div className="button-row"><button className="btn primary" onClick={() => setDecision('approved')}><Check size={15}/> Confirm transfer</button><button className="btn danger" onClick={() => setDecision('rejected')}><X size={15}/> Reject transfer</button></div>}</Card>
  </>
}
function UssdPage() {
  const [screen, setScreen] = useState(0)
  const [decision, setDecision] = useState<'confirm'|'reject'|null>(null)
  const [pin, setPin] = useState('')
  const screens = [
    'Safaricom  10:42\\n--------------------\\nHAKIARDHI\\nLand Registry Service\\n\\nWelcome, Mary Wanjiku.\\n\\n1. My Properties\\n2. Transfer Requests\\n3. Verify Title\\n\\nSelect option:',
    'MY PROPERTIES\\n--------------------\\n1. KJD/LOI/4581\\n   0.045 Ha\\n2. KJD/LOI/4590\\n   0.080 Ha\\n\\n0. Back',
    'TRANSFER REQUESTS\\n--------------------\\n1. TR-2026-0841\\nParcel: KJD/LOI/4581\\nBuyer: Peter Mwangi\\nType: Sale\\n\\n0. Back',
    'TRANSFER DETAILS\\n--------------------\\nParcel: KJD/LOI/4581\\nBuyer: Peter Mwangi\\n\\n1. Confirm transfer\\n2. Reject transfer\\n0. Back',
    'ENTER SECURITY PIN\\n--------------------\\nEnter your 4-digit PIN:\\n\\nUse keypad below.',
    'CONSENT RECORDED\\n--------------------\\nYour decision has been recorded.\\n\\nReference: TR-2026-0841\\n\\nThank you.\\n\\n0. Main menu',
    'TRANSFER REJECTED\\n--------------------\\nYour rejection has been recorded.\\n\\nReference: TR-2026-0841\\n\\nThank you.\\n\\n0. Main menu',
    'VERIFY TITLE\\n--------------------\\nKJD/LOI/4581\\nStatus: Registered\\n\\n0. Back',
  ]
  const keyPress = (key: string) => {
    if (screen === 0) setScreen(key === '1' ? 1 : key === '2' ? 2 : key === '3' ? 7 : 0)
    else if ([1,2,7].includes(screen)) { if (key === '0') setScreen(0); else if (screen === 2 && key === '1') setScreen(3) }
    else if (screen === 3) { if (key === '1' || key === '2') { setDecision(key === '1' ? 'confirm' : 'reject'); setPin(''); setScreen(4) } else if (key === '0') setScreen(2) }
    else if (screen === 4) { if (/^\d$/.test(key) && pin.length < 4) { const next = pin + key; setPin(next); if (next.length === 4) setScreen(decision === 'confirm' ? 5 : 6) } else if (key === '*') setPin('') }
    else if ([5,6].includes(screen) && key === '0') { setScreen(0); setDecision(null); setPin('') }
  }
  const reset = () => { setScreen(0); setPin(''); setDecision(null) }
  return <><PageHeading title="USSD Feature Phone Simulator" subtitle="A low-connectivity consent channel for citizens without smartphones or internet."/>
    <div className="two-col section-gap align-start"><Card><div className="eyebrow">SIMULATED NETWORK</div><Badge tone="green">2G · GSM · USSD session</Badge><div className="phone"><div className="phone-brand">HAKIARDHI MOBILE SERVICE</div><div className="phone-screen">{screens[screen].replace('\\n','\n')}{screen === 4 ? `\n\nPIN: ${'•'.repeat(pin.length)}` : ''}</div><div className="keypad">{['1','2','3','4','5','6','7','8','9','*','0','#'].map(k => <button key={k} onClick={() => keyPress(k)}>{k}</button>)}</div><div className="phone-softkeys"><span>CALL</span><span>MENU</span><span>END</span></div></div><div className="center"><button className="btn" onClick={reset}><RotateCcw size={14}/> Restart session</button></div></Card>
      <Card><h3>How the USSD consent flow works</h3><ActivityRow title="Dial *483*55#" meta="Citizen opens a network USSD session." status="1"/><ActivityRow title="Select transfer requests" meta="View pending transfer notifications." status="2"/><ActivityRow title="Review parcel and buyer" meta="Check the transaction before making a decision." status="3"/><ActivityRow title="Authenticate with PIN" meta="Securely authorize or reject the request." status="4"/><ActivityRow title="Consent recorded" meta="Backend records authenticated consent and anchors its hash." status="5"/><div className="notice">Prototype note: This is an interactive USSD simulation. Actual deployment requires a mobile network gateway, secure PIN verification and a backend consent service. A phone without internet can still use operator-provided USSD connectivity.</div></Card></div>
  </>
}
function TamperPage({ record, setRecord, tampered }: { record: typeof originalRecord; setRecord: (r: typeof originalRecord) => void; tampered: boolean }) {
  const update = (key: keyof typeof originalRecord, value: string) => setRecord({ ...record, [key]: value })
  return <><PageHeading title="Tamper Detection Security Tool" subtitle="Simulate unauthorized database modification and detect integrity violations."/>
    <Card className="section-gap"><div className="card-heading"><h3>Live integrity comparison</h3><Badge tone={tampered ? 'red' : 'green'}>{tampered ? '⚠ Mismatch detected' : '● Records match'}</Badge></div><div className="two-col"><div><div className="card-heading"><h3>Database record</h3><Badge tone="blue">Mutable</Badge></div><label className="field-label">Registered proprietor</label><input className="text-input" value={record.owner} onChange={e => update('owner', e.target.value)}/><label className="field-label">Parcel size</label><input className="text-input" value={record.size} onChange={e => update('size', e.target.value)}/><label className="field-label">County</label><input className="text-input" value={record.county} onChange={e => update('county', e.target.value)}/><small className="muted">Edit any field to simulate unauthorized access.</small></div><div><div className="card-heading"><h3>Blockchain anchor</h3><Badge tone="green">Immutable reference</Badge></div>{Object.entries({owner:'Expected proprietor',size:'Expected parcel size',county:'Expected county'}).map(([key,label])=><div className="anchor-field" key={key}><small>{label}</small><b>{originalRecord[key as keyof typeof originalRecord]}</b></div>)}<small className="muted">Stored SHA-256 digest</small><div className="hash">7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a</div></div></div>
      {tampered ? <div className="tamper-alert"><div><AlertTriangle size={26}/> TAMPER DETECTED</div><b>CRITICAL INTEGRITY VIOLATION — DATABASE / LEDGER MISMATCH</b><p>Unauthorized modification detected. Anchored reference no longer matches the database record. The transfer should be blocked pending investigation.</p></div> : <div className="confidence"><CheckCircle2 size={17}/> Integrity verified. Current record matches the anchored reference.</div>}
      <div className="button-row"><button className="btn" onClick={() => setRecord({...originalRecord, owner:'John Kamau (UNAUTHORIZED)'})}>Simulate unauthorized edit</button><button className="btn primary" onClick={() => setRecord(originalRecord)}>Restore original record</button></div>
    </Card><p className="muted small">Technical note: This demo compares input fields to a fixed expected record. Production should canonicalize the complete record, calculate SHA-256 independently and compare the digest with an authenticated ledger value.</p>
  </>
}
function CertificatePage() {
  const [copied, setCopied] = useState(false)
  return <><PageHeading title="Digital Title Certificate" subtitle="Formal, printable title deed prototype." action={<button className="btn primary" onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</button>}/>
    <div className="certificate-wrap section-gap" id="print-certificate"><div className="certificate">
      <div className="cert-country">REPUBLIC OF KENYA</div><div className="cert-seal"><Landmark size={27}/></div><h2>MINISTRY OF LANDS</h2><h3>DIGITAL LAND TITLE CERTIFICATE</h3><div className="cert-rule"/><Badge tone="amber">VERSION 2 · SUPERSEDES VERSION 1</Badge><p className="cert-intro">CERTIFICATE OF TITLE</p><div className="cert-parcel">KJD/LOI/4581</div><p>This certifies that the registered proprietor of the parcel described below is:</p><h2 className="cert-owner">MARY WANJIKU KAMAU</h2>
      <div className="cert-details"><div><small>COUNTY</small><b>Kajiado</b></div><div><small>REGISTRATION AREA</small><b>Loitokitok</b></div><div><small>AREA</small><b>0.045 Hectares</b></div><div><small>TENURE</small><b>Freehold</b></div><div><small>REGISTERED</small><b>14 March 2018</b></div><div><small>TITLE VERSION</small><b>Version 2</b></div></div><div className="cert-rule"/>
      <div className="cert-bottom"><div><small>UNIQUE VERIFICATION ID</small><b>HA-KJD-4581-V2-2026</b><small>BLOCKCHAIN SHA-256 DIGEST</small><div className="hash">7c2e9f8a1b6d4c3e5f0a7b9d2e1c8f6a4b3d9e0f2a5c7b1d8e6f4a9c3b2d1e0f</div></div><div className="qr-wrap"><div className="qr" aria-label="Illustrative QR code">{Array.from({length:81},(_,i)=><i key={i} style={{background: ((i*7+i*i*3)%11<5 || [0,1,2,9,10,18,20,54,56,72,73,74,80].includes(i)) ? '#263c35':'#fff'}}/>)}</div><small>SCAN TO VERIFY TITLE</small></div></div><div className="cert-rule"/><div className="cert-issuer"><div><small>ISSUING AUTHORITY</small><b>Land Registrar · Kajiado</b></div><Badge tone="green">Ledger anchored</Badge></div><p className="cert-disclaimer">Synthetic demonstration certificate only. Not a legally issued title deed. Verify through the official land registry before relying on ownership claims.</p>
    </div></div>
  </>
}
function AuditPage({ query, setQuery, rows }: { query: string; setQuery: (v: string) => void; rows: string[][] }) {
  return <><PageHeading title="Immutable Audit Trail" subtitle="Chronological record of ledger-anchored land registry events."/>
    <div className="stats-grid"><Stat label="Ledger transactions" value="8,512" note="Committed records"/><Stat label="Current block" value="8,512" note="Fabric ledger"/><Stat label="Network peers" value="04" note="Synchronized" tone="good"/><Stat label="Integrity incidents" value="00" note="No incidents" tone="good"/></div>
    <Card className="section-gap"><div className="card-heading"><h3>Transaction history</h3><div className="search-mini"><Search size={14}/><input placeholder="Search reference / actor..." value={query} onChange={e => setQuery(e.target.value)}/></div></div><div className="table-wrap"><table><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Reference</th><th>Transaction ID</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row[4]}>{row.map((cell,i)=><td key={i}>{cell}</td>)}<td><Badge tone="green">Committed</Badge></td></tr>)}</tbody></table>{rows.length===0 && <div className="empty-state">No matching transactions found.</div>}</div><small className="muted">Transaction IDs are shortened display values for this mockup. Full cryptographic identifiers are stored in the ledger.</small></Card>
  </>
}
function LoginPage({ message, setMessage }: { message: string; setMessage: (v: string) => void }) {
  const [role, setRole] = useState('Government Staff')
  const [identity, setIdentity] = useState('')
  const [pin, setPin] = useState('')
  return <><PageHeading title="Secure Access to HakiArdhi" subtitle="Role-based authentication for the National Land Registry."/>
    <Card className="login-card section-gap"><div className="login-emblem"><Landmark size={26}/></div><h2>Welcome to HakiArdhi</h2><p className="muted">Sign in using your authorized account</p><label className="field-label">Access category</label><select className="text-input" value={role} onChange={e => setRole(e.target.value)}><option>Government Staff</option><option>Registered Landowner / Citizen</option><option>Public Title Verification</option></select><label className="field-label">National ID / Staff Number</label><input className="text-input" value={identity} onChange={e => setIdentity(e.target.value)} placeholder="Enter your ID number"/><label className="field-label">Password / PIN</label><input className="text-input" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter password or PIN"/><button className="btn primary full-width" onClick={() => setMessage(identity && pin ? `Demo authentication only for ${role}. Credentials have not been verified.` : 'Please enter both ID and password/PIN.')}>Authenticate securely <ArrowRight size={15}/></button>{message && <div className="notice">{message}</div>}<div className="login-security"><LockKeyhole size={15}/> Prototype only. No real credentials are collected or authenticated.</div></Card>
  </>
}
export default App
