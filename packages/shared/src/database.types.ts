export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          city_id: string | null;
          created_at: string;
          event_name: string;
          id: number;
          properties: NonNullable<Json>;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          city_id?: string | null;
          created_at?: string;
          event_name: string;
          id?: never;
          properties?: NonNullable<Json>;
          user_id?: string | null;
        };
        Update: {
          city_id?: string | null;
          created_at?: string;
          event_name?: string;
          id?: never;
          properties?: NonNullable<Json>;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          created_at: string;
          criteria: NonNullable<Json>;
          description: string | null;
          icon_url: string | null;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          criteria?: NonNullable<Json>;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          criteria?: NonNullable<Json>;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      business_staff: {
        Row: {
          business_id: string;
          created_at: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_staff_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          category: string | null;
          city_id: string | null;
          cover_image_url: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          follower_count: number;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          slug: string;
          updated_at: string;
          verified: boolean;
          website_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          follower_count?: number;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          slug: string;
          updated_at?: string;
          verified?: boolean;
          website_url?: string | null;
        };
        Update: {
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          follower_count?: number;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          slug?: string;
          updated_at?: string;
          verified?: boolean;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_participants: {
        Row: {
          challenge_id: string;
          completed_at: string | null;
          joined_at: string;
          progress: NonNullable<Json>;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenge_id: string;
          completed_at?: string | null;
          joined_at?: string;
          progress?: NonNullable<Json>;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          completed_at?: string | null;
          joined_at?: string;
          progress?: NonNullable<Json>;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          city_id: string | null;
          created_at: string;
          description: string | null;
          end_at: string;
          id: string;
          requirements: NonNullable<Json>;
          start_at: string;
          status: string;
          title: string;
          type: string;
          updated_at: string;
          xp_reward: number;
        };
        ComputedFields: never;
        Insert: {
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_at: string;
          id?: string;
          requirements?: NonNullable<Json>;
          start_at: string;
          status?: string;
          title: string;
          type: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Update: {
          city_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_at?: string;
          id?: string;
          requirements?: NonNullable<Json>;
          start_at?: string;
          status?: string;
          title?: string;
          type?: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      check_ins: {
        Row: {
          created_at: string;
          crew_id: string | null;
          event_id: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          note: string | null;
          place_id: string | null;
          user_id: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          crew_id?: string | null;
          event_id?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          note?: string | null;
          place_id?: string | null;
          user_id: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          crew_id?: string | null;
          event_id?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          note?: string | null;
          place_id?: string | null;
          user_id?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_crew_id_fkey";
            columns: ["crew_id"];
            isOneToOne: false;
            referencedRelation: "crews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          center_lat: number;
          center_lng: number;
          country: string;
          created_at: string;
          id: string;
          is_launched: boolean;
          name: string;
          slug: string;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          center_lat: number;
          center_lng: number;
          country: string;
          created_at?: string;
          id?: string;
          is_launched?: boolean;
          name: string;
          slug: string;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          center_lat?: number;
          center_lng?: number;
          country?: string;
          created_at?: string;
          id?: string;
          is_launched?: boolean;
          name?: string;
          slug?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          parent_comment_id: string | null;
          post_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          parent_comment_id?: string | null;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          parent_comment_id?: string | null;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      crew_members: {
        Row: {
          crew_id: string;
          joined_at: string;
          role: string;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          crew_id: string;
          joined_at?: string;
          role?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          crew_id?: string;
          joined_at?: string;
          role?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey";
            columns: ["crew_id"];
            isOneToOne: false;
            referencedRelation: "crews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crew_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crews: {
        Row: {
          avatar_url: string | null;
          category: string | null;
          city_id: string | null;
          cover_image_url: string | null;
          created_at: string;
          creator_id: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          member_count: number;
          name: string;
          privacy: string;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          creator_id: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          member_count?: number;
          name: string;
          privacy?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          creator_id?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          member_count?: number;
          name?: string;
          privacy?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crews_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crews_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_attendees: {
        Row: {
          created_at: string;
          event_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_id: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          business_id: string | null;
          capacity: number | null;
          category: string | null;
          city_id: string | null;
          cover_image_url: string | null;
          created_at: string;
          crew_id: string | null;
          deleted_at: string | null;
          description: string | null;
          end_at: string | null;
          id: string;
          organizer_id: string;
          place_id: string | null;
          slug: string;
          start_at: string;
          status: string;
          title: string;
          updated_at: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          business_id?: string | null;
          capacity?: number | null;
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          crew_id?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_at?: string | null;
          id?: string;
          organizer_id: string;
          place_id?: string | null;
          slug: string;
          start_at: string;
          status?: string;
          title: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          business_id?: string | null;
          capacity?: number | null;
          category?: string | null;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          crew_id?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_at?: string | null;
          id?: string;
          organizer_id?: string;
          place_id?: string | null;
          slug?: string;
          start_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_crew_id_fkey";
            columns: ["crew_id"];
            isOneToOne: false;
            referencedRelation: "crews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          challenges: boolean;
          comments: boolean;
          crew_activity: boolean;
          event_reminders: boolean;
          follows: boolean;
          likes: boolean;
          push_enabled: boolean;
          recommendations: boolean;
          streaks: boolean;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          challenges?: boolean;
          comments?: boolean;
          crew_activity?: boolean;
          event_reminders?: boolean;
          follows?: boolean;
          likes?: boolean;
          push_enabled?: boolean;
          recommendations?: boolean;
          streaks?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          challenges?: boolean;
          comments?: boolean;
          crew_activity?: boolean;
          event_reminders?: boolean;
          follows?: boolean;
          likes?: boolean;
          push_enabled?: boolean;
          recommendations?: boolean;
          streaks?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          target_id: string | null;
          target_type: string | null;
          type: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          address: string | null;
          business_id: string | null;
          category: string;
          city_id: string | null;
          cover_image_url: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          lat: number;
          lng: number;
          name: string;
          popularity_score: number;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          business_id?: string | null;
          category: string;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          lat: number;
          lng: number;
          name: string;
          popularity_score?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          business_id?: string | null;
          category?: string;
          city_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          lat?: number;
          lng?: number;
          name?: string;
          popularity_score?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "places_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "places_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      post_media: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          height: number | null;
          id: string;
          media_type: string;
          position: number;
          post_id: string;
          thumbnail_url: string | null;
          url: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type: string;
          position?: number;
          post_id: string;
          thumbnail_url?: string | null;
          url: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type?: string;
          position?: number;
          post_id?: string;
          thumbnail_url?: string | null;
          url?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          body: string | null;
          city_id: string | null;
          created_at: string;
          crew_id: string | null;
          deleted_at: string | null;
          id: string;
          kind: string;
          poll_options: Json | null;
          updated_at: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body?: string | null;
          city_id?: string | null;
          created_at?: string;
          crew_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          kind?: string;
          poll_options?: Json | null;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          author_id?: string;
          body?: string | null;
          city_id?: string | null;
          created_at?: string;
          crew_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          kind?: string;
          poll_options?: Json | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_crew_id_fkey";
            columns: ["crew_id"];
            isOneToOne: false;
            referencedRelation: "crews";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          city_id: string | null;
          created_at: string;
          deleted_at: string | null;
          display_name: string | null;
          id: string;
          onboarding_completed_at: string | null;
          updated_at: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          id: string;
          onboarding_completed_at?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          id?: string;
          onboarding_completed_at?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          comment_id: string | null;
          created_at: string;
          id: string;
          post_id: string | null;
          reaction_type: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reaction_type?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          category: string;
          created_at: string;
          details: string | null;
          id: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
          target_id: string;
          target_type: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_posts: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      streaks: {
        Row: {
          current_count: number;
          id: string;
          is_active: boolean;
          last_activity_date: string | null;
          longest_count: number;
          streak_type: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          current_count?: number;
          id?: string;
          is_active?: boolean;
          last_activity_date?: string | null;
          longest_count?: number;
          streak_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          current_count?: number;
          id?: string;
          is_active?: boolean;
          last_activity_date?: string | null;
          longest_count?: number;
          streak_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_badges: {
        Row: {
          awarded_at: string;
          badge_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          awarded_at?: string;
          badge_id: string;
          user_id: string;
        };
        Update: {
          awarded_at?: string;
          badge_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_interests: {
        Row: {
          created_at: string;
          interest: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          interest: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interest?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vibes: {
        Row: {
          created_at: string;
          crew_id: string | null;
          expires_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          place_id: string | null;
          text: string | null;
          user_id: string;
          vibe_type: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          crew_id?: string | null;
          expires_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          place_id?: string | null;
          text?: string | null;
          user_id: string;
          vibe_type: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          crew_id?: string | null;
          expires_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          place_id?: string | null;
          text?: string | null;
          user_id?: string;
          vibe_type?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vibes_crew_id_fkey";
            columns: ["crew_id"];
            isOneToOne: false;
            referencedRelation: "crews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vibes_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vibes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      xp_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          reason: string;
          reference_id: string | null;
          reference_type: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          reason: string;
          reference_id?: string | null;
          reference_type?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          reason?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      user_xp_totals: {
        Row: {
          total_xp: number | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_crew_privacy: { Args: { target_crew_id: string }; Returns: string };
      get_home_feed: {
        Args: { before_created_at?: string; before_id?: string; page_size?: number };
        Returns: {
          author_avatar_url: string;
          author_display_name: string;
          author_id: string;
          author_username: string;
          body: string;
          city_id: string;
          comment_count: number;
          created_at: string;
          crew_id: string;
          id: string;
          kind: string;
          poll_options: Json;
          reaction_count: number;
          updated_at: string;
          viewer_has_reacted: boolean;
          visibility: string;
        }[];
      };
      get_suggested_people: {
        Args: { result_limit?: number };
        Returns: {
          avatar_url: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      is_business_staff: { Args: { target_business_id: string; viewer: string }; Returns: boolean };
      is_content_visible_to: {
        Args: { content_crew_id: string; owner: string; viewer: string; visibility: string };
        Returns: boolean;
      };
      is_crew_admin: { Args: { target_crew_id: string; viewer: string }; Returns: boolean };
      is_crew_member: {
        Args: { require_approved?: boolean; target_crew_id: string; viewer: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
