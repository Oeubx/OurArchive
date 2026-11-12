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

export type TakedownStatus = "pending" | "quarantined" | "purged" | "dismissed";

export type TakedownRequestRecord = {
  id: string;
  link_id: string | null;
  target_query: string;
  submitted_drive_url: string | null;
  resolved_drive_url: string | null;
  work_title_snapshot: string | null;
  requester_role: "author" | "drive_owner" | "uploader" | "community";
  requester_email: string | null;
  ownership_proof: string;
  removal_preference: "permanent" | "hide";
  reason: string | null;
  status: TakedownStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserBookmarkRecord = {
  id: string;
  user_id: string;
  link_id: string;
  work_title: string;
  author_name: string;
  fandom: string | null;
  scroll_percent: number;
  last_page: number;
  is_pdf: boolean;
  child_id: string | null;
  child_title: string | null;
  child_mime_type: string | null;
  created_at: string;
  updated_at: string;
};

export type UserProfileRecord = {
  id: string;
  display_name: string;
  role: UserRole;
  is_banned: boolean;
  submission_count: number;
  created_at: string;
  updated_at: string;
};

export type DriveLinkRecord = {
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
};

export type LinkMetadataRecord = {
  link_id: string;
  title: string;
  author_name: string;
  fandom: string;
  pairing: string | null;
  rating: string | null;
  word_count: number;
  summary: string | null;
  tags: string[];
  canonical_source_url: string | null;

  // Google Drive file properties
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  drive_owner_name: string | null;
  drive_owner_email: string | null;
  is_owner_masked: boolean;

  created_at: string;
  updated_at: string;
};

export type LinkVerificationRecord = {
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
};

export type AdminActionRecord = {
  id: string;
  link_id: string | null;
  admin_id: string;
  action_type: AdminActionType;
  reason: string;
  work_title_snapshot: string | null;
  author_name_snapshot: string | null;
  fandom_snapshot: string | null;
  masked_url_snapshot: string | null;
  is_tombstone: boolean;
  executed_at: string;
};

export type FeedbackRecord = {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  rating: number;
  is_anonymous: boolean;
  created_at: string;
};

export type PublicSearchFeedRecord = {
  work_id: string;
  upload_mode: UploadMode;
  uploaded_at: string;
  title: string;
  author_name: string;
  fandom: string;
  pairing: string | null;
  rating: string | null;
  word_count: number;
  summary: string | null;
  tags: string[];
  mime_type: string;
  display_drive_owner: string | null;
  verification_badge: VerificationBadge;
  admin_verified_at: string | null;
  automated_risk_score: number;
  path_reveal_token: string;
};

export type AdminTriageFeedRecord = {
  link_id: string;
  drive_url: string;
  google_file_id: string;
  upload_mode: UploadMode;
  verification_status: VerificationStatus;
  is_hidden: boolean;
  is_removed: boolean;
  uploader_user_id: string | null;
  uploader_name: string | null;
  submitted_at: string;
  title: string | null;
  author_name: string | null;
  fandom: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  drive_owner_email: string | null;
  automated_risk_score: number | null;
  automated_flags: Json | null;
  scanner_passed: boolean | null;
  admin_notes: string | null;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRecord;
        Insert: Omit<UserProfileRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfileRecord, "id">>;
        Relationships: [];
      };
      drive_links: {
        Row: DriveLinkRecord;
        Insert: Omit<DriveLinkRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DriveLinkRecord, "id">>;
        Relationships: [];
      };
      link_metadata: {
        Row: LinkMetadataRecord;
        Insert: Omit<LinkMetadataRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<LinkMetadataRecord, "link_id">>;
        Relationships: [];
      };
      link_verifications: {
        Row: LinkVerificationRecord;
        Insert: Omit<LinkVerificationRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<LinkVerificationRecord, "id">>;
        Relationships: [];
      };
      admin_actions: {
        Row: AdminActionRecord;
        Insert: Omit<
          AdminActionRecord,
          | "id"
          | "executed_at"
          | "work_title_snapshot"
          | "author_name_snapshot"
          | "fandom_snapshot"
          | "masked_url_snapshot"
          | "is_tombstone"
        > & {
          id?: string;
          executed_at?: string;
          work_title_snapshot?: string | null;
          author_name_snapshot?: string | null;
          fandom_snapshot?: string | null;
          masked_url_snapshot?: string | null;
          is_tombstone?: boolean;
        };
        Update: Partial<Omit<AdminActionRecord, "id">>;
        Relationships: [];
      };
      feedback: {
        Row: FeedbackRecord;
        Insert: Omit<FeedbackRecord, "id" | "created_at"> & {
          id?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<FeedbackRecord, "id" | "user_id">>;
        Relationships: [];
      };
      takedown_requests: {
        Row: TakedownRequestRecord;
        Insert: Omit<
          TakedownRequestRecord,
          "id" | "created_at" | "updated_at" | "resolved_by" | "resolved_at" | "status"
        > & {
          id?: string;
          status?: TakedownStatus;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TakedownRequestRecord, "id">>;
        Relationships: [];
      };
      user_bookmarks: {
        Row: UserBookmarkRecord;
        Insert: Omit<UserBookmarkRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserBookmarkRecord, "id">>;
        Relationships: [];
      };
    };
    Views: {
      vw_public_search_feed: {
        Row: PublicSearchFeedRecord;
        Relationships: [];
      };
      vw_admin_triage_feed: {
        Row: AdminTriageFeedRecord;
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      upload_mode: UploadMode;
      verification_status: VerificationStatus;
      admin_action_type: AdminActionType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
