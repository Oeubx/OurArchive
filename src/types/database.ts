export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "contributor" | "admin";
export type UploadMode = "authenticated" | "assisted_admin";
export type VerificationStatus =
  | "pending_scan"
  | "pending_review"
  | "verified"
  | "rejected"
  | "flagged";
export type VerificationBadge = "UNVERIFIED" | "AUTOMATED_PASS" | "MANUAL_VERIFIED";
export type AdminActionType =
  | "VERIFY"
  | "APPROVE"
  | "REJECT"
  | "HIDE"
  | "UNHIDE"
  | "CONTACT"
  | "REMOVE";

export interface UserProfileRecord {
  id: string;
  display_name: string;
  role: UserRole;
  is_banned: boolean;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface DriveLinkRecord {
  id: string;
  drive_url: string;
  google_file_id: string;
  upload_mode: UploadMode;
  uploader_user_id: string | null;
  verification_status: VerificationStatus;
  is_hidden: boolean;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkMetadataRecord {
  link_id: string;
  title: string;
  author_name: string;
  fandom: string;
  pairing: string | null;
  rating: string | null;
  word_count: number;
  summary: string | null;
  tags: string[];
  canonical_ao3_url: string | null;

  // Google Drive file properties
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  drive_owner_name: string | null;
  drive_owner_email: string | null;
  is_owner_masked: boolean;

  created_at: string;
  updated_at: string;
}

export interface LinkVerificationRecord {
  id: string;
  link_id: string;
  automated_risk_score: number;
  automated_flags: Json;
  scanner_passed: boolean;
  admin_verified_by: string | null;
  admin_verified_at: string | null;
  admin_notes: string | null;
  verification_badge: VerificationBadge;
  created_at: string;
}

export interface AdminActionRecord {
  id: string;
  link_id: string;
  admin_id: string;
  action_type: AdminActionType;
  reason: string;
  executed_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRecord;
        Insert: Omit<UserProfileRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfileRecord, "id">>;
      };
      drive_links: {
        Row: DriveLinkRecord;
        Insert: Omit<DriveLinkRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DriveLinkRecord, "id">>;
      };
      link_metadata: {
        Row: LinkMetadataRecord;
        Insert: Omit<LinkMetadataRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<LinkMetadataRecord, "link_id">>;
      };
      link_verifications: {
        Row: LinkVerificationRecord;
        Insert: Omit<LinkVerificationRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<LinkVerificationRecord, "id">>;
      };
      admin_actions: {
        Row: AdminActionRecord;
        Insert: Omit<AdminActionRecord, "id" | "executed_at"> & {
          id?: string;
          executed_at?: string;
        };
        Update: Partial<Omit<AdminActionRecord, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      upload_mode: UploadMode;
      verification_status: VerificationStatus;
      admin_action_type: AdminActionType;
    };
  };
}
