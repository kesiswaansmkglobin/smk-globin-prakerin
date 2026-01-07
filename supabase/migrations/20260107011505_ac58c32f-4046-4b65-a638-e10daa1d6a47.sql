-- Allow kaprog to view ALL guru_pembimbing (not limited to their department)
-- This is needed for prakerin dropdown where any guru can supervise students

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Kaprog can view guru in their department" ON guru_pembimbing;

-- Create new policy that allows kaprog to view all guru_pembimbing
CREATE POLICY "Kaprog can view all guru_pembimbing" 
ON guru_pembimbing 
FOR SELECT 
USING (has_role(auth.uid(), 'kaprog'::app_role));