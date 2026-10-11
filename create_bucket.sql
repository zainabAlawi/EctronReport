-- Create a bucket for attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow all authenticated users to upload to the attachments bucket
CREATE POLICY "Allow authenticated users to upload attachments" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'attachments');

-- Allow all users to read from the attachments bucket
CREATE POLICY "Allow public to read attachments" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'attachments');
