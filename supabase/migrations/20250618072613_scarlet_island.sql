/*
  # Super Admin System Implementation

  1. Database Schema Changes
    - Add superadmin role to app_role enum
    - Create system_settings table for global configurations
    - Create component_permissions table for granular access control

  2. Security
    - Enable RLS on new tables
    - Add policies for superadmin access to all existing tables
    - Create helper functions for permission checking

  3. Default Data
    - Insert default system settings
    - Insert default component permissions for all roles
*/

-- Step 1: Add superadmin to the app_role enum
-- This must be done first and committed before using the new value
ALTER TYPE app_role ADD VALUE 'superadmin';

-- Commit the enum change by ending this statement block
-- The rest will be handled in subsequent operations

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
  role_required text NOT NULL, -- Using text instead of enum to avoid the commit issue
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

-- Create helper function to check if user has specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id uuid, check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role::text INTO user_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN user_role = check_role;
END;
$$;

-- RLS Policies for system_settings
CREATE POLICY "Super admins can manage system settings"
  ON public.system_settings
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can read system settings"
  ON public.system_settings
  FOR SELECT
  TO public
  USING (user_has_role(auth.uid(), 'admin') OR user_has_role(auth.uid(), 'superadmin'));

-- RLS Policies for component_permissions
CREATE POLICY "Super admins can manage component permissions"
  ON public.component_permissions
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can read component permissions"
  ON public.component_permissions
  FOR SELECT
  TO public
  USING (user_has_role(auth.uid(), 'admin') OR user_has_role(auth.uid(), 'superadmin'));

-- Update existing RLS policies to include superadmin access
-- Profiles table
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

-- Objectives table
CREATE POLICY "Super admins can manage all objectives"
  ON public.objectives
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

-- Objective updates table
CREATE POLICY "Super admins can manage all objective updates"
  ON public.objective_updates
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

-- Daily work table
CREATE POLICY "Super admins can manage all daily work"
  ON public.daily_work
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'));

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
  user_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_to_check text;
  permission_exists boolean;
BEGIN
  -- Get user role if not provided
  IF user_role IS NULL THEN
    SELECT role::text INTO user_role_to_check
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
  IF NOT user_has_role(auth.uid(), 'superadmin') THEN
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

-- Create function to check if updates are globally enabled
CREATE OR REPLACE FUNCTION updates_globally_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  enabled boolean;
  deadline_str text;
  deadline_date date;
BEGIN
  -- Check if updates are enabled
  SELECT (get_system_setting('updates_enabled')::text)::boolean INTO enabled;
  
  -- If disabled globally, return false
  IF NOT enabled THEN
    RETURN false;
  END IF;
  
  -- Check deadline
  SELECT get_system_setting('updates_deadline')::text INTO deadline_str;
  
  -- Remove quotes from JSON string and convert to date
  deadline_str := trim(both '"' from deadline_str);
  deadline_date := deadline_str::date;
  
  -- Check if current date is before deadline
  RETURN CURRENT_DATE <= deadline_date;
END;
$$;