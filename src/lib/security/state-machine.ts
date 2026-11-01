/**
 * Verification & Quarantine State Machine
 * Backlog Items: [OA-M3-F3]
 * Specifications: docs/backlogs/module-3-verification-safety/verification_lifecycle_spec.md
 *                 docs/architecture/security_and_verification_pipeline.md
 */

import type {
  VerificationStatus,
  VerificationBadge,
  AdminActionType,
} from "@/types/database";
import type { ThreatScanResult } from "@/lib/security/threat-scanner";

/**
 * Risk score threshold for automatic quarantine.
 * Any link scoring >= 80 is immediately quarantined and hidden.
 */
export const QUARANTINE_RISK_THRESHOLD = 80;

export interface StateMachineEvaluation {
  status: VerificationStatus;
  badge: VerificationBadge;
  isHidden: boolean;
  scannerPassed: boolean;
  quarantineReason?: string;
}

/**
 * Allowed status transitions matrix per Module 3 specifications.
 */
const VALID_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  pending_scan: ["pending_review", "flagged", "rejected"],
  pending_review: ["verified", "rejected", "flagged"],
  flagged: ["pending_review", "rejected"],
  verified: ["flagged", "rejected"],
  rejected: ["pending_review", "flagged"],
};

/**
 * Validates whether a requested verification status transition is permitted.
 */
export function isValidStatusTransition(
  fromStatus: VerificationStatus,
  toStatus: VerificationStatus
): boolean {
  if (fromStatus === toStatus) return true;
  const allowedNext = VALID_TRANSITIONS[fromStatus];
  return Boolean(allowedNext && allowedNext.includes(toStatus));
}

/**
 * Determines the resulting verification status, badge, and visibility
 * from an automated threat scan result.
 */
export function evaluateScanStateMachine(
  scanResult: ThreatScanResult
): StateMachineEvaluation {
  // Auto-quarantine trigger for dangerous links
  if (
    scanResult.riskScore >= QUARANTINE_RISK_THRESHOLD ||
    !scanResult.safeBrowsingClean ||
    scanResult.isDangerousExtension ||
    scanResult.isWritable
  ) {
    const primaryReason = !scanResult.safeBrowsingClean
      ? "Google Safe Browsing threat match detected."
      : scanResult.isDangerousExtension
      ? "Dangerous or executable file extension detected."
      : scanResult.isWritable
      ? "Google Drive link has public edit permissions enabled."
      : `High automated threat score (${scanResult.riskScore}/100).`;

    return {
      status: "flagged",
      badge: "UNVERIFIED",
      isHidden: true,
      scannerPassed: false,
      quarantineReason: primaryReason,
    };
  }

  // Clean or low-risk link -> Pending Administrator Review
  const isZeroRisk = scanResult.riskScore === 0;

  return {
    status: "pending_review",
    badge: isZeroRisk ? "AUTOMATED_PASS" : "UNVERIFIED",
    isHidden: false,
    scannerPassed: isZeroRisk,
  };
}

/**
 * Resolves the updated verification badge when an administrator executes an action.
 */
export function resolveBadgeForAdminAction(
  actionType: AdminActionType,
  currentBadge: VerificationBadge
): VerificationBadge {
  switch (actionType) {
    case "APPROVE":
      return "MANUAL_VERIFIED";
    case "REJECT":
      return "UNVERIFIED";
    case "VERIFY":
      return currentBadge;
    case "HIDE":
    case "UNHIDE":
    case "CONTACT":
    case "REMOVE":
      return currentBadge;
    default:
      return currentBadge;
  }
}
