-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Create storage policies for file uploads
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view files they uploaded" ON storage.objects
FOR SELECT USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete files they uploaded" ON storage.objects
FOR DELETE USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);