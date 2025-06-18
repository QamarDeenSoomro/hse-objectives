/*
  # Action Items Management System

  1. New Tables
    - `action_items`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `target_date` (date, required)
      - `priority` (enum: low, medium, high, critical)
      - `status` (enum: open, closed, pending_verification, verified)
      - `assigned_to` (uuid, references profiles)
      - `verifier_id` (uuid, references profiles)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `closed_at` (timestamptz)
      - `verified_at` (timestamptz)

    - `action_item_closures`
      - `id` (uuid, primary key)
      - `action_item_id` (uuid, references action_items)
      - `closure_text` (text, required)
      - `media_urls` (text array)
      - `closed_by` (uuid, references profiles)
      - `created_at` (timestamptz)

    - `action_item_verifications`
      - `id` (uuid, primary key)
      - `action_item_id` (uuid, references action_items)
      - `verification_status` (enum: approved, rejected)
      - `verification_comments` (text)
      - `verified_by` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Users can view their assigned action items
    - Admins can manage all action items
    - Verifiers can verify action items assigned to them
*/

-- Create enums for action items
CREATE TYPE action_item_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE action_item_status AS ENUM ('open', 'closed', 'pending_verification', 'verified');
CREATE TYPE verification_status AS ENUM ('approved', 'rejected');

-- Create action_items table
CREATE TABLE IF NOT EXISTS public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_date date NOT NULL,
  priority action_item_priority DEFAULT 'medium',
  status action_item_status DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id) ON DELETE CASCADE,
  verifier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  verified_at timestamptz,
  CONSTRAINT valid_target_date CHECK (target_date >= CURRENT_DATE)
);

-- Create action_item_closures table
CREATE TABLE IF NOT EXISTS public.action_item_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id uuid REFERENCES action_items(id) ON DELETE CASCADE,
  closure_text text NOT NULL,
  media_urls text[],
  closed_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create action_item_verifications table
CREATE TABLE IF NOT EXISTS public.action_item_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id uuid REFERENCES action_items(id) ON DELETE CASCADE,
  verification_status verification_status NOT NULL,
  verification_comments text,
  verified_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_verifier_id ON action_items(verifier_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_target_date ON action_items(target_date);
CREATE INDEX IF NOT EXISTS idx_action_item_closures_action_item_id ON action_item_closures(action_item_id);
CREATE INDEX IF NOT EXISTS idx_action_item_verifications_action_item_id ON action_item_verifications(action_item_id);

-- Enable RLS
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_item_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_item_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for action_items
CREATE POLICY "Users can view their assigned action items"
  ON public.action_items
  FOR SELECT
  TO public
  USING (
    auth.uid() = assigned_to OR 
    auth.uid() = verifier_id OR 
    auth.uid() = created_by OR
    has_role(auth.uid(), 'admin'::app_role) OR
    user_has_role(auth.uid(), 'superadmin'::text)
  );

CREATE POLICY "Users can update their assigned action items"
  ON public.action_items
  FOR UPDATE
  TO public
  USING (
    auth.uid() = assigned_to OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    user_has_role(auth.uid(), 'superadmin'::text)
  );

CREATE POLICY "Admins can manage all action items"
  ON public.action_items
  FOR ALL
  TO public
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    user_has_role(auth.uid(), 'superadmin'::text)
  );

CREATE POLICY "Super admins can manage all action items"
  ON public.action_items
  FOR ALL
  TO public
  USING (user_has_role(auth.uid(), 'superadmin'::text))
  WITH CHECK (user_has_role(auth.uid(), 'superadmin'::text));

-- RLS Policies for action_item_closures
CREATE POLICY "Users can view closures for their action items"
  ON public.action_item_closures
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM action_items 
      WHERE action_items.id = action_item_closures.action_item_id 
      AND (
        action_items.assigned_to = auth.uid() OR 
        action_items.verifier_id = auth.uid() OR 
        action_items.created_by = auth.uid() OR
        has_role(auth.uid(), 'admin'::app_role) OR
        user_has_role(auth.uid(), 'superadmin'::text)
      )
    )
  );

CREATE POLICY "Users can create closures for their assigned action items"
  ON public.action_item_closures
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM action_items 
      WHERE action_items.id = action_item_closures.action_item_id 
      AND action_items.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all action item closures"
  ON public.action_item_closures
  FOR ALL
  TO public
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    user_has_role(auth.uid(), 'superadmin'::text)
  );

-- RLS Policies for action_item_verifications
CREATE POLICY "Users can view verifications for their action items"
  ON public.action_item_verifications
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM action_items 
      WHERE action_items.id = action_item_verifications.action_item_id 
      AND (
        action_items.assigned_to = auth.uid() OR 
        action_items.verifier_id = auth.uid() OR 
        action_items.created_by = auth.uid() OR
        has_role(auth.uid(), 'admin'::app_role) OR
        user_has_role(auth.uid(), 'superadmin'::text)
      )
    )
  );

CREATE POLICY "Verifiers can create verifications for their assigned action items"
  ON public.action_item_verifications
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM action_items 
      WHERE action_items.id = action_item_verifications.action_item_id 
      AND (
        action_items.verifier_id = auth.uid() OR
        has_role(auth.uid(), 'admin'::app_role) OR
        user_has_role(auth.uid(), 'superadmin'::text)
      )
    )
  );

CREATE POLICY "Admins can manage all action item verifications"
  ON public.action_item_verifications
  FOR ALL
  TO public
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    user_has_role(auth.uid(), 'superadmin'::text)
  );

-- Create function to update action item status automatically
CREATE OR REPLACE FUNCTION update_action_item_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a closure is created, update action item status to 'closed'
  IF TG_TABLE_NAME = 'action_item_closures' AND TG_OP = 'INSERT' THEN
    UPDATE action_items 
    SET 
      status = 'closed',
      closed_at = NEW.created_at,
      updated_at = now()
    WHERE id = NEW.action_item_id;
    
    -- If there's a verifier, set status to 'pending_verification'
    UPDATE action_items 
    SET status = 'pending_verification'
    WHERE id = NEW.action_item_id AND verifier_id IS NOT NULL;
    
    RETURN NEW;
  END IF;
  
  -- When a verification is created, update action item status
  IF TG_TABLE_NAME = 'action_item_verifications' AND TG_OP = 'INSERT' THEN
    IF NEW.verification_status = 'approved' THEN
      UPDATE action_items 
      SET 
        status = 'verified',
        verified_at = NEW.created_at,
        updated_at = now()
      WHERE id = NEW.action_item_id;
    ELSE
      UPDATE action_items 
      SET 
        status = 'open',
        closed_at = NULL,
        updated_at = now()
      WHERE id = NEW.action_item_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_action_item_status_on_closure
  AFTER INSERT ON action_item_closures
  FOR EACH ROW
  EXECUTE FUNCTION update_action_item_status();

CREATE TRIGGER trigger_update_action_item_status_on_verification
  AFTER INSERT ON action_item_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_action_item_status();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();