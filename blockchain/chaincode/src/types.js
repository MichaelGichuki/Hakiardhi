"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferWorkflowStatus = exports.TitleStatus = void 0;
var TitleStatus;
(function (TitleStatus) {
    TitleStatus["ACTIVE"] = "ACTIVE";
    TitleStatus["UNDER_TRANSFER"] = "UNDER_TRANSFER";
    TitleStatus["SUPERSEDED"] = "SUPERSEDED";
    TitleStatus["REVOKED"] = "REVOKED";
})(TitleStatus || (exports.TitleStatus = TitleStatus = {}));
var TransferWorkflowStatus;
(function (TransferWorkflowStatus) {
    TransferWorkflowStatus["INITIATED"] = "INITIATED";
    TransferWorkflowStatus["LANDOWNER_CONFIRMED"] = "LANDOWNER_CONFIRMED";
    TransferWorkflowStatus["LANDOWNER_REJECTED"] = "LANDOWNER_REJECTED";
    TransferWorkflowStatus["DOCUMENTS_VERIFIED"] = "DOCUMENTS_VERIFIED";
    TransferWorkflowStatus["APPROVED"] = "APPROVED";
    TransferWorkflowStatus["REJECTED"] = "REJECTED";
})(TransferWorkflowStatus || (exports.TransferWorkflowStatus = TransferWorkflowStatus = {}));
//# sourceMappingURL=types.js.map