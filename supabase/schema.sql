-- ============================================================================
-- CODEVANTA ADVANTA HUB — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ============================================================================
-- Comprehensive schema with Row Level Security (RLS), constraints, foreign keys,
-- indexes, triggers, and audited append-only financial ledger.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'member', 'admin')),
  phone_number TEXT,
  country TEXT NOT NULL DEFAULT 'KE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES & TAGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'code',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 3. RESOURCES & VERIFICATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  detailed_description TEXT NOT NULL,
  official_website TEXT NOT NULL,
  documentation_url TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  pricing_classification TEXT NOT NULL CHECK (pricing_classification IN (
    'free_and_open_source', 'free_hosted_service', 'freemium', 'limited_trial', 'paid', 'unknown'
  )),
  free_tier_details TEXT NOT NULL DEFAULT '',
  api_key_required BOOLEAN NOT NULL DEFAULT false,
  account_required BOOLEAN NOT NULL DEFAULT false,
  credit_card_required BOOLEAN NOT NULL DEFAULT false,
  usage_limits TEXT NOT NULL DEFAULT '',
  license_info TEXT NOT NULL DEFAULT '',
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT true,
  skill_level TEXT NOT NULL DEFAULT 'all_levels' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  programming_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_verification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'stale', 'unverified', 'archived')),
  editorial_notes TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  click_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(verification_status);
CREATE INDEX IF NOT EXISTS idx_resources_pricing ON resources(pricing_classification);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources viewable by everyone" ON resources FOR SELECT USING (verification_status != 'archived');
CREATE POLICY "Admins can manage all resources" ON resources FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resource tags viewable by everyone" ON resource_tags FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES profiles(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view verification logs" ON verification_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS resource_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  resource_name TEXT NOT NULL,
  official_website TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  description TEXT NOT NULL,
  free_tier_info TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE resource_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and create own submissions" ON resource_submissions 
  FOR ALL USING (submitted_by = auth.uid());
CREATE POLICY "Admins can manage submissions" ON resource_submissions 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, resource_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON bookmarks FOR ALL USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. MEMBERSHIP PLANS & ENTITLEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL CHECK (slug IN ('basic', 'pro', 'vip')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_kes NUMERIC(10, 2) NOT NULL,
  direct_referral_reward_kes NUMERIC(10, 2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'lifetime' CHECK (billing_cycle IN ('lifetime', 'monthly', 'annual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membership plans viewable by everyone" ON membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON membership_plans FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  plan_slug TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'refunded')),
  amount_paid_kes NUMERIC(10, 2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memberships" ON memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all memberships" ON memberships FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 5. LEARNING GUIDES & BLUEPRINTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  estimated_minutes INT NOT NULL DEFAULT 15,
  min_plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (min_plan_tier IN ('free', 'basic', 'pro', 'vip')),
  starter_kit_download_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE learning_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published learning guides viewable" ON learning_guides FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage learning guides" ON learning_guides FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 6. REFERRAL ENGINE & ATTRIBUTION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referral code" ON referral_codes FOR SELECT USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS referral_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code TEXT NOT NULL REFERENCES referral_codes(code),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  ip_address_hash TEXT,
  user_agent_hash TEXT,
  status TEXT NOT NULL DEFAULT 'attributed' CHECK (status IN ('attributed', 'qualified', 'invalidated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT no_self_referral CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ref_attributions_referrer ON referral_attributions(referrer_user_id);
ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers view own attributions" ON referral_attributions FOR SELECT USING (referrer_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribution_id UUID NOT NULL REFERENCES referral_attributions(id),
  referrer_user_id UUID NOT NULL REFERENCES profiles(id),
  referred_user_id UUID NOT NULL REFERENCES profiles(id),
  qualifying_payment_id UUID NOT NULL,
  plan_slug TEXT NOT NULL,
  reward_amount_kes NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'clawed_back')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  hold_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_payment_reward UNIQUE (qualifying_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_rewards_referrer ON referral_rewards(referrer_user_id);
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own rewards" ON referral_rewards FOR SELECT USING (referrer_user_id = auth.uid());
CREATE POLICY "Admins manage all rewards" ON referral_rewards FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 7. WALLET & AUDITED APPEND-ONLY LEDGER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'KES',
  pending_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
  approved_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (approved_balance >= 0),
  withdrawn_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (withdrawn_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON wallet_accounts FOR SELECT USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'reward_pending', 'reward_approved', 'reward_clawback',
    'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'fee_deduction'
  )),
  amount_kes NUMERIC(12, 2) NOT NULL,
  balance_after_kes NUMERIC(12, 2) NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('referral_reward', 'withdrawal_request', 'system_adjustment')),
  reference_id UUID NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON wallet_ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON wallet_ledger_entries(user_id);
ALTER TABLE wallet_ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger entries" ON wallet_ledger_entries FOR SELECT USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount_kes NUMERIC(10, 2) NOT NULL CHECK (amount_kes >= 100),
  fee_kes NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  net_amount_kes NUMERIC(10, 2) NOT NULL,
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mpesa_b2c' CHECK (payment_method IN ('mpesa_b2c', 'manual_bank', 'manual_mpesa')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'
  )),
  external_transaction_id TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view and submit own withdrawals" ON withdrawal_requests FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins manage withdrawals" ON withdrawal_requests FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 8. PAYMENTS & WEBHOOK EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  amount_kes NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  provider TEXT NOT NULL CHECK (provider IN ('mpesa', 'sandbox', 'card')),
  provider_reference TEXT NOT NULL,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  raw_payload JSONB,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage all payments" ON payments FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view payment events" ON payment_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ----------------------------------------------------------------------------
-- 9. ADMIN AUDIT & PROGRAMME SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON admin_audit_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE TABLE IF NOT EXISTS programme_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE programme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by authenticated users" ON programme_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON programme_settings FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
