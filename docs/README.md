# OurArchive Documentation Hub

> **Emergency Community Notice & Platform Scope Disclaimer**  
> **OurArchive** is an emergency, temporary measure to aid fanfiction readers and authors during service outages on primary fanwork archives, and is strictly not intended to replace, compete with, or replicate the permanent operations of existing community fanfiction platforms.
> 
> All creative works belong 100% to their original creators. The system operates on a strict **Read-Only / Zero-Download** principle: files are never stored or downloaded onto OurArchive servers. If any author or Drive owner wishes to have their work or link removed, please contact the administrator, and it will be removed immediately.

---

## 1. Documentation Map & Navigation

This documentation hub provides the architectural, operational, and development source of truth for **OurArchive**. All links utilize strict relative paths for maximum portability.

```
docs/
├── README.md                                      # This Documentation Hub
├── ci_cd.md                                       # CI/CD Architecture & GitHub Actions Contract
├── disclaimers/                                   # Community Governance & Legal Protection
│   ├── README.md                                  # Disclaimers Index & Mission Charter
│   ├── fanfic_authors_and_ownership.md           # Creator Rights & 100% Intellectual Property
│   ├── drive_owners_and_privacy.md                # View-Only Guidance & Owner Privacy Masking
│   ├── copyright_and_temporary_aid.md             # Transformative Fair Use & Community Archive Solidarity
│   └── takedown_and_removal_request.md            # Immediate Takedown Policy & Contact Guide
├── architecture/                                  # Technical & System Design Specifications
│   ├── system_overview.md                         # Architecture Topology & Sequence Lifecycle
│   ├── drive_ingestion_and_search.md              # Canonical Link Regex & Dual-Path Upload
│   ├── security_and_verification_pipeline.md     # 2-Tier Automated Scanner & Admin 6-Action Suite
│   └── reader_and_anti_bot_protection.md         # Reader Sandbox & Anti-Bot Edge Defense
├── database/                                      # PostgreSQL Relational Engine & Schema
│   ├── README.md                                  # Database Topology, Pooling & RLS Overview
│   ├── schema_definition.md                       # Complete PostgreSQL DDL & Table Schemas
│   ├── search_and_display_projection.md           # Display Contract & Public Feed Views
│   └── indexes_and_performance.md                 # Full-Text Search tsvector & GIN Performance
├── infrastructure/                                # Cloud Deployment & Hosting Setup
│   ├── hosting_and_deployment.md                  # Vercel Serverless, Edge Middleware & Envs
│   └── supabase_architecture.md                   # Supabase Auth, RLS, Webhooks & Migrations
└── backlogs/                                      # Sprint Tracking & Feature Code Catalog
    ├── OA_Sprint_Backlogs_Commit_Reference.md     # Master Backlog Catalog (OA-M0 to OA-M3)
    ├── module-0-infrastructure/                   # M0: Vercel, Supabase, CI/CD
    ├── module-1-auth-db/                          # M1: Auth, Profiles, RBAC, Schema
    ├── module-2-drive-upload-search/              # M2: Ingestion, Viewer, Search, Layout
    └── module-3-verification-safety/              # M3: Scanner, Admin Suite, Disclaimers
```

---

## 2. Quick Reference by Capability

### Core Governance & Safety
- **Need to request a work removal?** Read the [Immediate Takedown & Removal Policy](disclaimers/takedown_and_removal_request.md).
- **Author Rights & Ownership**: Read [Fanfiction Authors & Ownership Rights](disclaimers/fanfic_authors_and_ownership.md).
- **Drive Owner Information**: Read [Google Drive Owners & Privacy Notice](disclaimers/drive_owners_and_privacy.md).

### System & Architecture Design
- **How works are ingested and read?** Read [System Architecture & Operational Overview](architecture/system_overview.md).
- **How Google Drive links are validated?** Read [Drive Ingestion & Search Specification](architecture/drive_ingestion_and_search.md).
- **How automated scanning and admin reviews work?** Read [Security & Verification Pipeline](architecture/security_and_verification_pipeline.md).
- **How bot spam and scraping are prevented?** Read [Reader Sandbox & Anti-Bot Protection](architecture/reader_and_anti_bot_protection.md).

### Database & Relational Storage
- **PostgreSQL Schemas & RLS Rules**: Read [Database Schema Definition & DDL Contracts](database/schema_definition.md).
- **Exact UI Display Layout & Query Projections**: Read [Search & Display Projection Architecture](database/search_and_display_projection.md).
- **Full-Text Search & GIN Index Tuning**: Read [Database Indexes & Performance Optimization](database/indexes_and_performance.md).

### Cloud Infrastructure
- **Serverless Edge Hosting on Vercel**: Read [Hosting & Deployment Infrastructure](infrastructure/hosting_and_deployment.md).
- **Supabase BaaS, Discord OAuth & Webhooks**: Read [Supabase Platform Architecture](infrastructure/supabase_architecture.md).

### Development & Delivery
- **Commit Code Grammar & Backlogs**: Read [OurArchive Sprint Backlogs & Commit Reference](backlogs/OA_Sprint_Backlogs_Commit_Reference.md).
- **CI/CD Pipelines**: Read [OurArchive CI/CD & Delivery Architecture](ci_cd.md).
- **Git Commit Drafting Skill**: See [`.agents/skills/git-commits/SKILL.md`](../.agents/skills/git-commits/SKILL.md).
- **GitHub PR Management Skill**: See [`.agents/skills/github-pr/SKILL.md`](../.agents/skills/github-pr/SKILL.md).
