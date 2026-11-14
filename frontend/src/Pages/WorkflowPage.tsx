import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Badge } from "../Components/Badge";
import { Card } from "../Components/Card";
import { PageHeading } from "../Components/PageHeading";
import type { TransferStage } from "../types";

export function WorkflowPage({
  stage,
  setStage,
}: {
  stage: TransferStage;
  setStage: (v: TransferStage) => void;
}) {
  const steps = [
    [
      "Transfer Initiation",
      "Land officer submits transfer application and supporting documents.",
    ],
    [
      "Landowner Consent",
      "Registered proprietor must personally approve or reject the transaction.",
    ],
    [
      "Document Verification",
      "Verification officer checks legal documents and cryptographic hashes.",
    ],
    [
      "Final Registrar Approval",
      "Registrar authorizes the new title version to be anchored on the ledger.",
    ],
  ];
  return (
    <>
      <PageHeading
        title="Transfer Workflow Engine"
        subtitle="End-to-end controlled land ownership transfer pipeline."
      />
      <Card className="section-gap">
        <div className="record-grid">
          <div>
            <span>Transfer reference</span>
            <b>TR-2026-0841</b>
          </div>
          <div>
            <span>Parcel</span>
            <b>KJD/LOI/4581</b>
          </div>
          <div>
            <span>Current owner</span>
            <b>Mary Wanjiku Kamau</b>
          </div>
          <div>
            <span>Proposed buyer</span>
            <b>Peter Mwangi Njoroge</b>
          </div>
        </div>
      </Card>
      <Card className="section-gap">
        <div className="card-heading">
          <h3>Process completion</h3>
          <Badge tone={stage === 4 ? "green" : "amber"}>{stage}/4 stages</Badge>
        </div>
        <div className="progress">
          <span style={{ width: `${(stage / 4) * 100}%` }} />
        </div>
        <div className="muted progress-caption">
          Stage {stage} of 4 · {steps[Math.min(stage - 1, 3)][0]}
        </div>
        <div className="workflow-steps">
          {steps.map(([title, desc], i) => (
            <div className="workflow-step" key={title}>
              <div
                className={`step-number ${i < stage ? "complete" : i === stage ? "current" : ""}`}
              >
                {i < stage ? <Check size={15} /> : i + 1}
              </div>
              <div className="step-copy">
                <b>
                  {i + 1}. {title}
                </b>
                <small>{desc}</small>
              </div>
              <Badge
                tone={i < stage ? "green" : i === stage ? "amber" : "slate"}
              >
                {i < stage ? "Completed" : i === stage ? "Current" : "Locked"}
              </Badge>
            </div>
          ))}
        </div>
        <div className="notice">
          <b>Critical business rule</b>
          <p>
            No transfer can proceed to verification or title issuance without
            authenticated, direct consent from the registered proprietor. Staff
            cannot override this consent requirement.
          </p>
        </div>
        <div className="button-row">
          <button
            className="btn primary"
            disabled={stage === 4}
            onClick={() => setStage(Math.min(4, stage + 1) as TransferStage)}
          >
            Simulate next approval <ArrowRight size={14} />
          </button>
          <button className="btn" onClick={() => setStage(1)}>
            <RotateCcw size={14} /> Reset demo
          </button>
        </div>
      </Card>
    </>
  );
}
