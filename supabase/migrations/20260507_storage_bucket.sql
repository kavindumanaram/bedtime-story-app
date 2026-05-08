-- Create the story-references storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-references', 'story-references', true)
ON CONFLICT (id) DO NOTHING;

-- Service role (backend) can insert images
CREATE POLICY "service role insert story images"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'story-references');

-- Service role can overwrite existing images (upsert)
CREATE POLICY "service role update story images"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'story-references');

-- Anyone can read the public images
CREATE POLICY "public read story images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'story-references');
