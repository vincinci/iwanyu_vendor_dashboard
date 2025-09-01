-- Messaging system for vendor-admin communication

-- Message threads
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  participants UUID[] NOT NULL, -- Array of user IDs
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'archived')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_threads (users can see threads they participate in)
CREATE POLICY "message_threads_select_participant" ON public.message_threads 
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "message_threads_insert_own" ON public.message_threads 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "message_threads_update_participant" ON public.message_threads 
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- RLS policies for messages
CREATE POLICY "messages_select_participant" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = thread_id AND auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = thread_id AND auth.uid() = ANY(participants)
    ) AND auth.uid() = sender_id
  );
