/**
 * OurArchive Domain Contracts and RBAC Schema Definitions
 */

export type UserRole = "contributor" | "verifier" | "admin";

export type LinkStatus =
  | "under_verification"
  | "approved"
  | "hidden"
  | "rejected"
  | "flagged";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  submissionCount: number;
}

export interface DriveLink {
  id: string;
  title: string;
  authorName: string;
  fandom: string;
  pairing?: string;
  rating: "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit" | "Not Rated";
  wordCount: number;
  summary: string;
  tags: string[];
  rawDriveUrl: string;
  maskedDriveUrl: string;
  mimeType: string;
  driveOwnerName?: string;
  driveOwnerEmail?: string;
  isOwnerMasked: boolean;
  uploadedBy: string;
  uploadedByRole: UserRole;
  uploadedAt: string;
  status: LinkStatus;
  verificationBadge?: string;
  adminVerifiedAt?: string;
  verifiedBy?: string;
  automatedRiskScore: number; // 0 - 100
  isPriorVerified?: boolean;
}

export interface VerifierApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  trustPledge: string;
  status: "pending" | "approved" | "declined";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type AdminActionType =
  | "VERIFY"
  | "APPROVE"
  | "REJECT"
  | "HIDE"
  | "UNHIDE"
  | "REMOVE";

export interface AdminActionLog {
  id: string;
  linkId: string;
  adminId: string;
  adminName: string;
  actionType: AdminActionType;
  notes?: string;
  performedAt: string;
}
