-- ============================================================================
-- EcomSkool Companion App — initial schema, RLS, triggers, and seed.
--
-- Design principles (non-negotiable):
--   * Row Level Security is ON for every table.
--   * All gating logic is server-side. Students can READ their pipeline
--     progress but never mutate it directly — progress rows are created and
--     advanced only by SECURITY DEFINER functions / service-role routes.
--   * Uploaded files are versioned and never overwritten (no UPDATE/DELETE).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles: extends auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  community_member_id text,
  created_at timestamptz not null default now()
);

-- brands: one product / store per row
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  product_name text not null,
  target_market text,
  status text not null default 'active' check (status in ('active', 'killed', 'launched')),
  created_at timestamptz not null default now()
);
create index if not exists idx_brands_owner on public.brands(owner_id);

-- pipeline_steps: master definition of the 15 steps (editable by admins)
create table if not exists public.pipeline_steps (
  id int primary key,
  step_key text unique not null,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  output_file_types text[] not null default '{}',
  sort_order int not null,
  is_repeatable boolean not null default false,
  prompt_template text,
  video_url text,
  required_mcps text[] not null default '{}'
);

-- brand_step_progress: per-brand state of each step
create table if not exists public.brand_step_progress (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  step_id int not null references public.pipeline_steps(id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked', 'unlocked', 'in_progress', 'submitted', 'approved', 'failed')),
  unlocked_at timestamptz,
  completed_at timestamptz,
  unique (brand_id, step_id)
);
create index if not exists idx_bsp_brand on public.brand_step_progress(brand_id);

-- step_files: versioned uploads (immutable)
create table if not exists public.step_files (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  step_id int not null references public.pipeline_steps(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  original_filename text,
  version int not null default 1,
  parse_status text not null default 'pending'
    check (parse_status in ('pending', 'parsed', 'parse_failed', 'not_applicable')),
  parsed_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_step_files_brand_step on public.step_files(brand_id, step_id);

-- ---------------------------------------------------------------------------
-- Helper: admin check (SECURITY DEFINER to avoid RLS recursion on profiles)
-- ---------------------------------------------------------------------------
create or replace function public.is_ecomskool_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger: create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, community_member_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'community_member_id',
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: prevent non-admins from escalating their own role
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only admins may change a role. For anyone else, silently keep the old role
  -- so legitimate profile edits (e.g. full_name) still succeed.
  if new.role is distinct from old.role and not public.is_ecomskool_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_change on public.profiles;
create trigger trg_prevent_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

-- ---------------------------------------------------------------------------
-- Trigger: when a brand is created, seed its 15 step-progress rows.
-- Step with sort_order = 1 starts UNLOCKED; all others start LOCKED.
-- SECURITY DEFINER so it can write progress rows the student cannot write.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_brand()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.brand_step_progress (brand_id, step_id, status, unlocked_at)
  select
    new.id,
    ps.id,
    case when ps.sort_order = 1 then 'unlocked' else 'locked' end,
    case when ps.sort_order = 1 then now() else null end
  from public.pipeline_steps ps
  on conflict (brand_id, step_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_brand_created on public.brands;
create trigger on_brand_created
  after insert on public.brands
  for each row execute function public.handle_new_brand();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.pipeline_steps enable row level security;
alter table public.brand_step_progress enable row level security;
alter table public.step_files enable row level security;

-- profiles: read own (or admin reads all); insert only own row as a student;
-- update own row (role changes are blocked by the trigger above).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_ecomskool_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid() and role = 'student');

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- brands: owner reads/writes own; admins read/write all. No client deletes.
drop policy if exists brands_select_owner on public.brands;
create policy brands_select_owner on public.brands
  for select using (owner_id = auth.uid());

drop policy if exists brands_select_admin on public.brands;
create policy brands_select_admin on public.brands
  for select using (public.is_ecomskool_admin());

drop policy if exists brands_insert_owner on public.brands;
create policy brands_insert_owner on public.brands
  for insert with check (owner_id = auth.uid());

drop policy if exists brands_update_owner on public.brands;
create policy brands_update_owner on public.brands
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists brands_update_admin on public.brands;
create policy brands_update_admin on public.brands
  for update using (public.is_ecomskool_admin()) with check (public.is_ecomskool_admin());

-- pipeline_steps: any authenticated user can read the master steps;
-- only admins may edit them.
drop policy if exists steps_select_auth on public.pipeline_steps;
create policy steps_select_auth on public.pipeline_steps
  for select using (auth.uid() is not null);

drop policy if exists steps_write_admin on public.pipeline_steps;
create policy steps_write_admin on public.pipeline_steps
  for all using (public.is_ecomskool_admin()) with check (public.is_ecomskool_admin());

-- brand_step_progress: owner/admin can READ; only admins (or SECURITY DEFINER
-- functions / service role) may WRITE. Students never mutate gating directly.
drop policy if exists bsp_select_owner on public.brand_step_progress;
create policy bsp_select_owner on public.brand_step_progress
  for select using (
    exists (
      select 1 from public.brands b
      where b.id = brand_step_progress.brand_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists bsp_select_admin on public.brand_step_progress;
create policy bsp_select_admin on public.brand_step_progress
  for select using (public.is_ecomskool_admin());

drop policy if exists bsp_write_admin on public.brand_step_progress;
create policy bsp_write_admin on public.brand_step_progress
  for all using (public.is_ecomskool_admin()) with check (public.is_ecomskool_admin());

-- step_files: owner/admin read; owner (or admin) may INSERT new versions.
-- No UPDATE/DELETE policies => rows are immutable (versioned, never overwritten).
drop policy if exists files_select_owner on public.step_files;
create policy files_select_owner on public.step_files
  for select using (
    exists (
      select 1 from public.brands b
      where b.id = step_files.brand_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists files_select_admin on public.step_files;
create policy files_select_admin on public.step_files
  for select using (public.is_ecomskool_admin());

drop policy if exists files_insert_owner on public.step_files;
create policy files_insert_owner on public.step_files
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.brands b
      where b.id = step_files.brand_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists files_insert_admin on public.step_files;
create policy files_insert_admin on public.step_files
  for insert with check (public.is_ecomskool_admin());

-- ---------------------------------------------------------------------------
-- Seed: the 15 pipeline steps (idempotent; admin edits are preserved on re-run)
-- ---------------------------------------------------------------------------
insert into public.pipeline_steps
  (id, step_key, name_ar, name_en, description_ar, output_file_types, sort_order, is_repeatable, required_mcps)
values
  (1,  'product_research',    'بحث المنتجات الرابحة',            'Winning Product Research', 'العثور على منتج رابح عبر البحث في الاتجاهات والطلب والمنافسة.', '{xlsx}', 1, false, '{}'),
  (2,  'competitor_research', 'بحث المنافسين',                   'Competitor Research',      'تحليل المنافسين وإعلاناتهم وأسعارهم وعروضهم.', '{xlsx}', 2, false, '{}'),
  (3,  'validation',          'تحليل المنتج والسوق',             'Product & Market Analysis','التحقق من جدوى المنتج والسوق واتخاذ قرار المتابعة.', '{xlsx}', 3, false, '{}'),
  (4,  'language_bank',       'بنك اللغة',                       'Language Bank',            'جمع عبارات العملاء ونقاط الألم واللغة التسويقية.', '{xlsx}', 4, false, '{}'),
  (5,  'offer_creation',      'إنشاء العرض',                     'Offer Creation',           'بناء عرض لا يُقاوم للمنتج.', '{xlsx}', 5, false, '{}'),
  (6,  'unit_economics',      'اقتصاديات الوحدة',                'Unit Economics',           'حساب التكاليف والهوامش وربحية الوحدة.', '{xlsx}', 6, false, '{}'),
  (7,  'creative_strategy',   'استراتيجية الكرييتف',             'Creative Strategy',        'وضع خطة المحتوى الإعلاني والزوايا.', '{xlsx}', 7, false, '{}'),
  (8,  'branding_kit',        'الهوية البصرية',                  'Branding Kit',             'تصميم هوية العلامة (الألوان، الشعار، النبرة).', '{xlsx}', 8, false, '{}'),
  (9,  'ad_scripts',          'نصوص وسكربتات الإعلانات',          'Ad Copy & Scripts',        'كتابة نصوص وسكربتات الإعلانات.', '{docx}', 9, false, '{}'),
  (10, 'creative_production', 'الصور والفيديوهات',               'Statics & Videos',         'إنتاج الصور الثابتة والفيديوهات الإعلانية.', '{zip,png,mp4}', 10, false, '{}'),
  (11, 'pdp',                 'صفحة المنتج (PDP)',               'Product Page (PDP)',       'بناء صفحة المنتج على Shopify.', '{txt,html,checkbox}', 11, false, '{Shopify}'),
  (12, 'meta_campaign',       'إعداد حملة Meta',                 'Meta Campaign Build',      'بناء حملة إعلانية على Meta.', '{screenshot,pdf,checkbox}', 12, false, '{"Meta Ads"}'),
  (13, 'campaign_analysis',   'تحليل الحملة',                    'Campaign Analysis',        'تحليل أداء الحملات (CPA وROAS) بشكل دوري.', '{pdf}', 13, true, '{"Meta Ads"}'),
  (14, 'seo',                 'تحسين محركات البحث (SEO)',         'SEO Brain',                'تحسين المتجر لمحركات البحث.', '{checkbox,pdf}', 14, false, '{Shopify}'),
  (15, 'pl_workbook',         'الأرباح والخسائر الشهرية (P&L)',   'Monthly P&L',              'إعداد كشف الأرباح والخسائر الشهري.', '{xlsx}', 15, true, '{}')
on conflict (id) do nothing;
