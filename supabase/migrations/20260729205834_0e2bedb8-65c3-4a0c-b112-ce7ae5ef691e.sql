-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'driver');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  cpf TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'manager')
  )
$$;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_select_staff" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- STATIONS ------------------------------------------------------------
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stations_public_read" ON public.stations FOR SELECT USING (true);
CREATE POLICY "stations_admin_write" ON public.stations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TIERS ---------------------------------------------------------------
CREATE TABLE public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  min_liters NUMERIC NOT NULL DEFAULT 0,
  max_liters NUMERIC NOT NULL DEFAULT 9999,
  discount_per_liter NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'tier-bronze',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiers TO authenticated;
GRANT ALL ON public.tiers TO service_role;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers_public_read" ON public.tiers FOR SELECT USING (true);
CREATE POLICY "tiers_admin_write" ON public.tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FUELINGS ------------------------------------------------------------
CREATE TABLE public.fuelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  fuel_type TEXT NOT NULL DEFAULT 'Gasolina Comum',
  liters NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fuelings_user_idx ON public.fuelings (user_id, created_at DESC);
CREATE INDEX fuelings_created_idx ON public.fuelings (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuelings TO authenticated;
GRANT ALL ON public.fuelings TO service_role;
ALTER TABLE public.fuelings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fuelings_select_own" ON public.fuelings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fuelings_select_staff" ON public.fuelings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "fuelings_insert_staff" ON public.fuelings
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "fuelings_update_staff" ON public.fuelings
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PAYMENT TOKENS ------------------------------------------------------
CREATE TABLE public.fuel_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fuel_tokens_user_idx ON public.fuel_tokens (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_tokens TO authenticated;
GRANT ALL ON public.fuel_tokens TO service_role;
ALTER TABLE public.fuel_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fuel_tokens_select_own" ON public.fuel_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "fuel_tokens_insert_own" ON public.fuel_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fuel_tokens_select_staff" ON public.fuel_tokens
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "fuel_tokens_update_staff" ON public.fuel_tokens
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SIGNUP TRIGGER ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, cpf, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'cpf',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'driver')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED ----------------------------------------------------------------
INSERT INTO public.tiers (name, min_liters, max_liters, discount_per_liter, color, sort_order) VALUES
  ('Bronze', 0, 50, 0.05, 'tier-bronze', 1),
  ('Prata', 51, 150, 0.08, 'tier-silver', 2),
  ('Ouro', 151, 300, 0.10, 'tier-gold', 3),
  ('Diamante', 301, 9999, 0.15, 'tier-diamond', 4);

INSERT INTO public.stations (name, city, state) VALUES
  ('Posto Centro', 'São Paulo', 'SP'),
  ('Posto Av. Brasil', 'São Paulo', 'SP'),
  ('Posto Rodovia', 'Campinas', 'SP');