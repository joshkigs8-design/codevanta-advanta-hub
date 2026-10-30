// ============================================================================
// CODEVANTA ADVANTA HUB — CORE DATA TYPES & INTERFACES
// ============================================================================

export type UserRole = "user" | "member" | "admin";

export interface Profile {
  id: string; // matches auth user ID (UUID)
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  phone_number?: string;
  country: string; // e.g. "KE"
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export type PricingClassification =
  | "free_and_open_source"
  | "free_hosted_service"
  | "freemium"
  | "limited_trial"
  | "paid"
  | "unknown";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "all_levels";

export type VerificationStatus = "verified" | "stale" | "unverified" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Resource {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  detailed_description: string;
  official_website: string;
  documentation_url: string;
  category_id: string;
  category_slug?: string;
  category_name?: string;
  pricing_classification: PricingClassification;
  free_tier_details: string;
  api_key_required: boolean;
  account_required: boolean;
  credit_card_required: boolean;
  usage_limits: string;
  license_info: string;
  commercial_use_allowed: boolean;
  skill_level: SkillLevel;
  platforms: string[]; // JSON array in DB
  programming_languages: string[]; // JSON array in DB
  alternatives: string[]; // JSON array in DB
  last_verification_date: string;
  verification_status: VerificationStatus;
  editorial_notes: string;
  featured: boolean;
  click_count: number;
  image_url?: string;
  logo_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface VerificationLog {
  id: string;
  resource_id: string;
  verified_by: string;
  previous_status: VerificationStatus;
  new_status: VerificationStatus;
  notes: string;
  created_at: string;
}

export interface ResourceSubmission {
  id: string;
  submitted_by: string;
  resource_name: string;
  official_website: string;
  category_id: string;
  description: string;
  free_tier_info: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  resource_id: string;
  notes?: string;
  created_at: string;
  resource?: Resource;
}

export type PlanSlug = "starter" | "basic" | "pro" | "vip";

export interface MembershipPlan {
  id: string;
  slug: PlanSlug;
  name: string;
  description: string;
  price_kes: number;
  direct_referral_reward_kes: number;
  billing_cycle: "lifetime" | "monthly" | "annual";
  is_active: boolean;
  entitlements: {
    can_access_basic_directory: boolean;
    can_use_advanced_search: boolean;
    can_access_curated_collections: boolean;
    can_access_learning_paths: boolean;
    can_access_original_blueprints: boolean;
    can_download_starter_kits: boolean;
    can_access_early_releases: boolean;
    max_bookmarks: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  plan_id: string;
  plan_slug: PlanSlug;
  plan_name: string;
  status: "active" | "expired" | "cancelled" | "refunded";
  amount_paid_kes: number;
  starts_at: string;
  expires_at?: string | null;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  plan_slug: PlanSlug;
  max_uses: number;
  used_count: number;
  is_active: boolean | number;
  expires_at?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  redemptions?: PromoCodeRedemption[];
}

export interface PromoCodeRedemption {
  id: string;
  promo_code_id: string;
  promo_code: string;
  user_id: string;
  user_email: string;
  plan_slug: PlanSlug;
  redeemed_at: string;
}

export interface LearningGuide {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string; // Markdown / structured lessons
  category: string;
  difficulty: SkillLevel;
  estimated_minutes: number;
  min_plan_tier: "free" | "basic" | "pro" | "vip";
  starter_kit_download_url?: string;
  is_published: boolean;
  introduction?: string;
  prerequisites?: string[];
  supported_operating_systems?: string[];
  steps?: Array<{ title: string; instruction: string }>;
  references?: Array<{ title: string; url: string }>;
  last_verified_date?: string;
  publication_status?: "draft" | "published" | "archived";
  featured?: boolean;
  related_slugs?: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REFERRAL & WALLET LEDGER TYPES
// ============================================================================

export type ReferralProgramStatus =
  | "disabled"
  | "compliance_review"
  | "approved_for_launch"
  | "suspended";

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  clicks: number;
  created_at: string;
}

export interface ReferralAttribution {
  id: string;
  referral_code: string;
  referrer_user_id: string;
  referred_user_id: string;
  ip_address_hash?: string;
  user_agent_hash?: string;
  status: "attributed" | "qualified" | "invalidated";
  created_at: string;
}

export type RewardStatus = "pending" | "approved" | "rejected" | "clawed_back";

export interface ReferralReward {
  id: string;
  attribution_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  qualifying_payment_id: string;
  plan_slug: PlanSlug;
  reward_amount_kes: number;
  status: RewardStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  hold_until: string; // review window (e.g. 7 days or instant upon review)
  created_at: string;
  updated_at: string;
}

export interface WalletAccount {
  id: string;
  user_id: string;
  currency: string; // "KES"
  pending_balance: number;
  approved_balance: number; // withdrawable
  withdrawn_balance: number;
  created_at: string;
  updated_at: string;
}

export type LedgerEntryType =
  | "reward_pending"
  | "reward_approved"
  | "reward_clawback"
  | "withdrawal_request"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "fee_deduction";

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  user_id: string;
  entry_type: LedgerEntryType;
  amount_kes: number;
  balance_after_kes: number;
  reference_type: "referral_reward" | "withdrawal_request" | "system_adjustment";
  reference_id: string;
  notes: string;
  created_at: string;
}

export type WithdrawalStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_kes: number;
  fee_kes: number;
  net_amount_kes: number;
  phone_number: string;
  account_name: string;
  payment_method: "mpesa_b2c" | "manual_bank" | "manual_mpesa";
  status: WithdrawalStatus;
  external_transaction_id?: string;
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAYMENTS & AUDIT TYPES
// ============================================================================

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  amount_kes: number;
  currency: string;
  provider: "mpesa" | "sandbox" | "card";
  provider_reference: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  phone_number?: string;
  status: PaymentStatus;
  raw_payload?: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: "checkout_initiated" | "webhook_received" | "status_updated" | "refund_processed";
  provider: string;
  event_payload: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_entity: string;
  target_id: string;
  details: string; // JSON string
  ip_address?: string;
  created_at: string;
}

export interface ProgrammeSettings {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

// ============================================================================
// TUTORIALS, LEARNING PATHS, TROUBLESHOOTING & PROJECTS
// ============================================================================

export interface Tutorial {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "local-ai" | "ai-coding-agents" | "ides-tools" | "cloud-remote" | "deployment";
  difficulty: SkillLevel;
  estimated_minutes: number;
  prerequisites: string[]; // JSON array in DB
  supported_os: string[]; // JSON array in DB: Windows, macOS, Linux
  content: string; // Markdown
  troubleshooting_notes: string;
  security_warnings: string;
  official_docs_url: string;
  last_verified_date: string;
  is_published: boolean;
  featured: boolean;
  is_locked?: boolean;
  is_preview?: boolean;
  lock_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: SkillLevel;
  icon: string;
  estimated_hours: number;
  display_order: number;
  is_published: boolean;
  milestones?: LearningPathMilestone[];
  created_at: string;
  updated_at: string;
}

export interface LearningPathMilestone {
  id: string;
  path_id: string;
  step_number: number;
  title: string;
  description: string;
  target_type: "tutorial" | "project" | "resource" | "guide";
  target_id?: string;
  target_url?: string;
}

export interface TroubleshootingEntry {
  id: string;
  slug: string;
  error_message: string;
  affected_tool: string;
  category: string;
  likely_causes: string;
  step_by_step_fix: string;
  verification_steps: string;
  official_docs_url: string;
  last_verified_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuidedProject {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: SkillLevel;
  estimated_hours: number;
  prerequisites: string[];
  tech_stack: string[];
  expected_outcomes: string;
  content: string;
  starter_code_repo_url: string;
  demo_url: string;
  paid_services_warning: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentBenefit {
  id: string;
  slug: string;
  title: string;
  provider: string;
  category: string;
  description: string;
  benefits_included: string;
  eligibility_requirements: string;
  application_url: string;
  limitations: string;
  last_verified_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
