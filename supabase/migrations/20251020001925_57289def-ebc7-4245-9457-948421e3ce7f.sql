-- Enable delete for group messages by message owners who are active members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'group_messages' AND policyname = 'Group members can delete own messages'
  ) THEN
    CREATE POLICY "Group members can delete own messages"
    ON public.group_messages
    FOR DELETE
    USING (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = group_messages.group_id
          AND gm.user_id = auth.uid()
          AND gm.status = 'active'
      )
    );
  END IF;
END $$;

-- Enable delete for private messages by sender
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'private_messages' AND policyname = 'Users can delete their sent private messages'
  ) THEN
    CREATE POLICY "Users can delete their sent private messages"
    ON public.private_messages
    FOR DELETE
    USING (from_user_id = auth.uid());
  END IF;
END $$;