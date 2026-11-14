export type OriginalRecord = {
    owner: string;
    size: string;
    county: string;
};


export type Page =
  | "dashboard"
  | "parcels"
  | "workflow"
  | "landowner"
  | "ussd"
  | "tamper"
  | "certificate"
  | "audit"
  | "login";
export type TransferStage = 0 | 1 | 2 | 3 | 4;