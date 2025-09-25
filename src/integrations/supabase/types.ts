export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_commands: {
        Row: {
          command: string
          executed_at: string
          id: string
          parameters: Json | null
          result: string | null
          status: string | null
        }
        Insert: {
          command: string
          executed_at?: string
          id?: string
          parameters?: Json | null
          result?: string | null
          status?: string | null
        }
        Update: {
          command?: string
          executed_at?: string
          id?: string
          parameters?: Json | null
          result?: string | null
          status?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          priority: string | null
          status: string | null
          title: string
          type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          title: string
          type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          title?: string
          type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_private_messages: {
        Row: {
          admin_id: string | null
          created_at: string | null
          emoji_reactions: Json | null
          id: string
          is_encrypted: boolean | null
          is_from_admin: boolean | null
          message_content: string
          message_type: string | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          emoji_reactions?: Json | null
          id?: string
          is_encrypted?: boolean | null
          is_from_admin?: boolean | null
          message_content: string
          message_type?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          emoji_reactions?: Json | null
          id?: string
          is_encrypted?: boolean | null
          is_from_admin?: boolean | null
          message_content?: string
          message_type?: string | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_questions: {
        Row: {
          admin_response: string | null
          answered_at: string | null
          asked_at: string
          id: string
          question: string
          status: string
          user_email: string
          user_id: string
          user_uuid: string | null
        }
        Insert: {
          admin_response?: string | null
          answered_at?: string | null
          asked_at?: string
          id?: string
          question: string
          status?: string
          user_email: string
          user_id: string
          user_uuid?: string | null
        }
        Update: {
          admin_response?: string | null
          answered_at?: string | null
          asked_at?: string
          id?: string
          question?: string
          status?: string
          user_email?: string
          user_id?: string
          user_uuid?: string | null
        }
        Relationships: []
      }
      balance_history: {
        Row: {
          amount: number
          balance_type: string
          change_type: string
          created_at: string
          description: string | null
          id: string
          previous_amount: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_type: string
          change_type: string
          created_at?: string
          description?: string | null
          id?: string
          previous_amount?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_type?: string
          change_type?: string
          created_at?: string
          description?: string | null
          id?: string
          previous_amount?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_responses: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          source: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          source: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          source?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crawled_pages: {
        Row: {
          content: string
          crawled_at: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          content: string
          crawled_at?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          content?: string
          crawled_at?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_response: string | null
          created_at: string
          description: string
          dispute_type: string
          id: string
          resolved_at: string | null
          status: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          description: string
          dispute_type: string
          id?: string
          resolved_at?: string | null
          status?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          description?: string
          dispute_type?: string
          id?: string
          resolved_at?: string | null
          status?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      live_chat_sessions: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          session_data: Json | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          session_data?: Json | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          session_data?: Json | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_offers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completion_requirements: string
          created_at: string
          id: string
          offer_description: string
          offer_title: string
          offer_url: string
          reward_amount: number
          status: string
          total_cost: number
          user_id: string
          worker_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completion_requirements: string
          created_at?: string
          id?: string
          offer_description: string
          offer_title: string
          offer_url: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id: string
          worker_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completion_requirements?: string
          created_at?: string
          id?: string
          offer_description?: string
          offer_title?: string
          offer_url?: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id?: string
          worker_count?: number
        }
        Relationships: []
      }
      music_offers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          artist_name: string
          created_at: string
          id: string
          listen_duration: number
          music_title: string
          music_url: string
          reward_amount: number
          status: string
          total_cost: number
          user_id: string
          worker_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          artist_name: string
          created_at?: string
          id?: string
          listen_duration?: number
          music_title: string
          music_url: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id: string
          worker_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          artist_name?: string
          created_at?: string
          id?: string
          listen_duration?: number
          music_title?: string
          music_url?: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id?: string
          worker_count?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_type: string
          paystack_reference: string | null
          processed_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_type: string
          paystack_reference?: string | null
          processed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_type?: string
          paystack_reference?: string | null
          processed_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_email: string
          referrer_email: string
          referrer_id: string | null
          reward_amount: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_email: string
          referrer_email: string
          referrer_id?: string | null
          reward_amount?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string
          referrer_email?: string
          referrer_id?: string | null
          reward_amount?: number | null
          status?: string | null
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          created_at: string | null
          error_data: Json | null
          error_message: string
          error_type: string
          id: string
          ip_address: string | null
          resolved_at: string | null
          severity: string | null
          stack_trace: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_data?: Json | null
          error_message: string
          error_type: string
          id?: string
          ip_address?: string | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_data?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          ip_address?: string | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          amount_earned: number
          completed_at: string
          declined_reason: string | null
          id: string
          status: string
          task_id: string | null
          task_reference_id: string | null
          task_title: string
          task_type: string
          user_id: string
        }
        Insert: {
          amount_earned?: number
          completed_at?: string
          declined_reason?: string | null
          id?: string
          status?: string
          task_id?: string | null
          task_reference_id?: string | null
          task_title: string
          task_type?: string
          user_id: string
        }
        Update: {
          amount_earned?: number
          completed_at?: string
          declined_reason?: string | null
          id?: string
          status?: string
          task_id?: string | null
          task_reference_id?: string | null
          task_title?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          approval_type: string | null
          approved_at: string | null
          currency_symbol: string
          id: string
          reward_amount: number
          status: string
          submitted_at: string
          task_id: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          approval_type?: string | null
          approved_at?: string | null
          currency_symbol?: string
          id?: string
          reward_amount?: number
          status?: string
          submitted_at?: string
          task_id?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          approval_type?: string | null
          approved_at?: string | null
          currency_symbol?: string
          id?: string
          reward_amount?: number
          status?: string
          submitted_at?: string
          task_id?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          id: string
          instructions: string
          review_time: number
          reward_amount: number
          status: string
          task_description: string
          task_link: string
          task_name: string
          total_cost: number
          user_id: string
          worker_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          id?: string
          instructions: string
          review_time?: number
          reward_amount?: number
          status?: string
          task_description: string
          task_link: string
          task_name: string
          total_cost?: number
          user_id: string
          worker_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          id?: string
          instructions?: string
          review_time?: number
          reward_amount?: number
          status?: string
          task_description?: string
          task_link?: string
          task_name?: string
          total_cost?: number
          user_id?: string
          worker_count?: number
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message_text: string
          message_type: string | null
          processed: boolean | null
          user_id: string | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message_text: string
          message_type?: string | null
          processed?: boolean | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message_text?: string
          message_type?: string | null
          processed?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          available_balance: number
          checkin_balance: number
          created_at: string
          currency_code: string
          deposit_balance: number
          id: string
          total_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          checkin_balance?: number
          created_at?: string
          currency_code?: string
          deposit_balance?: number
          id?: string
          total_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          checkin_balance?: number
          created_at?: string
          currency_code?: string
          deposit_balance?: number
          id?: string
          total_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bank_details: {
        Row: {
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at: string
          email: string
          id: string
          updated_at: string
          user_id: string
          user_uuid: string | null
        }
        Insert: {
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at?: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
          user_uuid?: string | null
        }
        Update: {
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
          user_uuid?: string | null
        }
        Relationships: []
      }
      user_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          reward_amount: number | null
          user_id: string | null
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          reward_amount?: number | null
          user_id?: string | null
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          reward_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          feedback_text: string
          id: string
          submitted_at: string
          user_email: string
          user_id: string
          user_uuid: string | null
        }
        Insert: {
          feedback_text: string
          id?: string
          submitted_at?: string
          user_email: string
          user_id: string
          user_uuid?: string | null
        }
        Update: {
          feedback_text?: string
          id?: string
          submitted_at?: string
          user_email?: string
          user_id?: string
          user_uuid?: string | null
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          device_info: Json | null
          id: string
          ip_address: string | null
          location_info: Json | null
          login_timestamp: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          location_info?: Json | null
          login_timestamp?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          location_info?: Json | null
          login_timestamp?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_data: Json | null
          created_at: string
          emoji_reactions: Json | null
          expires_at: string | null
          id: string
          is_read_receipt: boolean | null
          message: string
          notification_category: string | null
          related_id: string | null
          status: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          created_at?: string
          emoji_reactions?: Json | null
          expires_at?: string | null
          id?: string
          is_read_receipt?: boolean | null
          message: string
          notification_category?: string | null
          related_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json | null
          created_at?: string
          emoji_reactions?: Json | null
          expires_at?: string | null
          id?: string
          is_read_receipt?: boolean | null
          message?: string
          notification_category?: string | null
          related_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          country: string | null
          country_code: string | null
          created_at: string
          currency_code: string | null
          currency_symbol: string | null
          email: string
          full_name: string
          gender: string | null
          ip_address: string | null
          is_active: boolean | null
          last_login: string | null
          mobile: string | null
          payment_method: string | null
          postal_code: string | null
          state: string | null
          telegram_chat_id: string | null
          updated_at: string
          username: string | null
          welcome_bonus: number | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          email: string
          full_name: string
          gender?: string | null
          ip_address?: string | null
          is_active?: boolean | null
          last_login?: string | null
          mobile?: string | null
          payment_method?: string | null
          postal_code?: string | null
          state?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          username?: string | null
          welcome_bonus?: number | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          currency_symbol?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          ip_address?: string | null
          is_active?: boolean | null
          last_login?: string | null
          mobile?: string | null
          payment_method?: string | null
          postal_code?: string | null
          state?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          username?: string | null
          welcome_bonus?: number | null
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          uploaded_at: string
          user_email: string
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string
          user_email: string
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uploaded_at?: string
          user_email?: string
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      video_jobs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          reward_amount: number
          status: string
          total_cost: number
          user_id: string
          video_description: string
          video_title: string
          video_url: string
          watch_duration: number
          worker_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id: string
          video_description: string
          video_title: string
          video_url: string
          watch_duration?: number
          worker_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          status?: string
          total_cost?: number
          user_id?: string
          video_description?: string
          video_title?: string
          video_url?: string
          watch_duration?: number
          worker_count?: number
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: string
          crawled_at: string
          id: string
          last_updated: string
          metadata: Json | null
          page_type: string | null
          title: string | null
          url: string
        }
        Insert: {
          content: string
          crawled_at?: string
          id?: string
          last_updated?: string
          metadata?: Json | null
          page_type?: string | null
          title?: string | null
          url: string
        }
        Update: {
          content?: string
          crawled_at?: string
          id?: string
          last_updated?: string
          metadata?: Json | null
          page_type?: string | null
          title?: string | null
          url?: string
        }
        Relationships: []
      }
      withdrawal_history: {
        Row: {
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          id: string
          net_amount: number
          paystack_reference: string | null
          platform_fee: number
          status: string
          user_available_balance_after: number
          user_available_balance_before: number
          user_id: string
          user_uuid: string | null
          withdrawal_date: string
        }
        Insert: {
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          id?: string
          net_amount: number
          paystack_reference?: string | null
          platform_fee?: number
          status?: string
          user_available_balance_after: number
          user_available_balance_before: number
          user_id: string
          user_uuid?: string | null
          withdrawal_date?: string
        }
        Update: {
          amount?: number
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          id?: string
          net_amount?: number
          paystack_reference?: string | null
          platform_fee?: number
          status?: string
          user_available_balance_after?: number
          user_available_balance_before?: number
          user_id?: string
          user_uuid?: string | null
          withdrawal_date?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          account_number: string
          admin_notes: string | null
          amount: number
          bank_name: string
          countdown_end: string
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          countdown_end?: string
          created_at?: string
          full_name: string
          id?: string
          phone_number?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          countdown_end?: string
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_admin_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_user_device_info: {
        Args: { user_agent_string: string }
        Returns: Json
      }
      increment_checkin_balance: {
        Args: { amount_param: number; user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
