/*
  # Super Admin System Enhancement

  1. Enum Updates
    - Add 'superadmin' to app_role enum (if not exists)
  
  2. New Tables
    - `system_settings` - Global system configurations
    - `component_permissions` - Granular access control
  
  3. Security
    - Enable RLS on new tables
    - Add policies for superadmin access
    - Update existing policies to include superadmin
  
  4. Functions
    - check_component_permission() - Check user permissions
    - get_system_setting() - Retrieve system settings
    - update_system_setting() - Update system settings (superadmin only)
  
  5. Default Data
    - Insert default system settings
    - Insert default component permissions
*/

-- Add superadmin to the app_role enum (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'app_role'
    )
  ) THEN
    ALTER TYPE app_role ADD VALUE 'superadmin';
  END IF;
END $$;

-- Create system_settings table for global configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id)
);

-- Create component_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.component_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name text NOT NULL,
  permission_type text NOT NULL, -- 'read', 'write', 'delete', 'admin'
  role_required app_role NOT NULL,
  is_enabled boolean DEFAULT true,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  UNIQUE(component_name, permission_type, role_required)
);

-- Enable RLS on new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Super admins can manage system settings'
  ) THEN
    CREATE POLICY "Super admins can manage system settings"
      ON public.system_settings
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_settings' 
    AND policyname = 'Admins can read system settings'
  ) THEN
    CREATE POLICY "Admins can read system settings"
      ON public.system_settings
      FOR SELECT
      TO public
      USING (user_has_role(auth.uid(), 'admin'::text) OR user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- RLS Policies for component_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'component_permissions' 
    AND policyname = 'Super admins can manage component permissions'
  ) THEN
    CREATE POLICY "Super admins can manage component permissions"
      ON public.component_permissions
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'component_permissions' 
    AND policyname = 'Admins can read component permissions'
  ) THEN
    CREATE POLICY "Admins can read component permissions"
      ON public.component_permissions
      FOR SELECT
      TO public
      USING (user_has_role(auth.uid(), 'admin'::text) OR user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- Update existing RLS policies to include superadmin access
-- Profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Super admins can manage all profiles'
  ) THEN
    CREATE POLICY "Super admins can manage all profiles"
      ON public.profiles
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- Objectives table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objectives' 
    AND policyname = 'Super admins can manage all objectives'
  ) THEN
    CREATE POLICY "Super admins can manage all objectives"
      ON public.objectives
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- Objective updates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objective_updates' 
    AND policyname = 'Super admins can manage all objective updates'
  ) THEN
    CREATE POLICY "Super admins can manage all objective updates"
      ON public.objective_updates
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- Daily work table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_work' 
    AND policyname = 'Super admins can manage all daily work'
  ) THEN
    CREATE POLICY "Super admins can manage all daily work"
      ON public.daily_work
      FOR ALL
      TO public
      USING (user_has_role(auth.uid(), 'superadmin'::text))
      WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));
  END IF;
END $$;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('updates_enabled', 'true', 'Global toggle for allowing updates'),
  ('updates_deadline', '"2025-12-31"', 'Global deadline for updates (ISO date string)'),
  ('component_access', '{"objectives": true, "updates": true, "daily_work": true, "reports": true, "users": true}', 'Component access control'),
  ('maintenance_mode', 'false', 'System maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default component permissions
INSERT INTO public.component_permissions (component_name, permission_type, role_required, is_enabled) VALUES
  ('objectives', 'read', 'user', true),
  ('objectives', 'write', 'admin', true),
  ('objectives', 'delete', 'admin', true),
  ('objectives', 'admin', 'superadmin', true),
  
  ('updates', 'read', 'user', true),
  ('updates', 'write', 'user', true),
  ('updates', 'delete', 'admin', true),
  ('updates', 'admin', 'superadmin', true),
  
  ('daily_work', 'read', 'user', true),
  ('daily_work', 'write', 'user', true),
  ('daily_work', 'delete', 'user', true),
  ('daily_work', 'admin', 'superadmin', true),
  
  ('reports', 'read', 'admin', true),
  ('reports', 'write', 'admin', true),
  ('reports', 'delete', 'admin', true),
  ('reports', 'admin', 'superadmin', true),
  
  ('users', 'read', 'admin', true),
  ('users', 'write', 'admin', true),
  ('users', 'delete', 'admin', true),
  ('users', 'admin', 'superadmin', true),
  
  ('system_settings', 'read', 'admin', true),
  ('system_settings', 'write', 'superadmin', true),
  ('system_settings', 'delete', 'superadmin', true),
  ('system_settings', 'admin', 'superadmin', true)
ON CONFLICT (component_name, permission_type, role_required) DO NOTHING;

-- Create function to check component permissions
CREATE OR REPLACE FUNCTION check_component_permission(
  component_name text,
  permission_type text,
  user_role app_role DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_to_check app_role;
  permission_exists boolean;
BEGIN
  -- Get user role if not provided
  IF user_role IS NULL THEN
    SELECT role INTO user_role_to_check
    FROM profiles
    WHERE id = auth.uid();
  ELSE
    user_role_to_check := user_role;
  END IF;
  
  -- Super admins always have access
  IF user_role_to_check = 'superadmin' THEN
    RETURN true;
  END IF;
  
  -- Check if permission exists and is enabled
  SELECT EXISTS(
    SELECT 1
    FROM component_permissions
    WHERE component_permissions.component_name = check_component_permission.component_name
      AND component_permissions.permission_type = check_component_permission.permission_type
      AND component_permissions.role_required = user_role_to_check
      AND component_permissions.is_enabled = true
      AND (component_permissions.valid_until IS NULL OR component_permissions.valid_until > now())
  ) INTO permission_exists;
  
  RETURN permission_exists;
END;
$$;

-- Create function to get system setting
CREATE OR REPLACE FUNCTION get_system_setting(setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT system_settings.setting_value INTO setting_value
  FROM system_settings
  WHERE system_settings.setting_key = get_system_setting.setting_key;
  
  RETURN setting_value;
END;
$$;

-- Create function to update system setting (superadmin only)
CREATE OR REPLACE FUNCTION update_system_setting(
  setting_key text,
  setting_value jsonb,
  description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is superadmin
  IF NOT user_has_role(auth.uid(), 'superadmin'::text) THEN
    RAISE EXCEPTION 'Only super admins can update system settings';
  END IF;
  
  -- Update or insert setting
  INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
  VALUES (setting_key, setting_value, description, auth.uid())
  ON CONFLICT (setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = COALESCE(EXCLUDED.description, system_settings.description),
    updated_at = now(),
    updated_by = auth.uid();
  
  RETURN true;
END;
$$;