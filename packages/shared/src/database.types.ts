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
          price_label: string | null;
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
          price_label?: string | null;
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
          price_label?: string | null;
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
          badges: boolean;
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
          xp_milestones: boolean;
        };
        ComputedFields: never;
        Insert: {
          badges?: boolean;
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
          xp_milestones?: boolean;
        };
        Update: {
          badges?: boolean;
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
          xp_milestones?: boolean;
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
      place_ratings: {
        Row: {
          created_at: string;
          id: string;
          place_id: string;
          rating: number;
          review: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          place_id: string;
          rating: number;
          review?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          place_id?: string;
          rating?: number;
          review?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "place_ratings_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "place_ratings_user_id_fkey";
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
          crew_preference: string | null;
          default_check_in_visibility: string;
          deleted_at: string | null;
          display_name: string | null;
          id: string;
          nightlife_pace: string | null;
          onboarding_completed_at: string | null;
          suspended_at: string | null;
          suspended_reason: string | null;
          travel_radius: string | null;
          updated_at: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: string | null;
          created_at?: string;
          crew_preference?: string | null;
          default_check_in_visibility?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          id: string;
          nightlife_pace?: string | null;
          onboarding_completed_at?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          travel_radius?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city_id?: string | null;
          created_at?: string;
          crew_preference?: string | null;
          default_check_in_visibility?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          id?: string;
          nightlife_pace?: string | null;
          onboarding_completed_at?: string | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          travel_radius?: string | null;
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
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          check_in_id: string | null;
          comment_id: string | null;
          created_at: string;
          id: string;
          post_id: string | null;
          reaction_type: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          check_in_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reaction_type?: string;
          user_id: string;
        };
        Update: {
          check_in_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_check_in_id_fkey";
            columns: ["check_in_id"];
            isOneToOne: false;
            referencedRelation: "check_ins";
            referencedColumns: ["id"];
          },
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
      user_genres: {
        Row: {
          created_at: string;
          genre: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          genre: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          genre?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_genres_user_id_fkey";
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
      user_neighborhoods: {
        Row: {
          created_at: string;
          neighborhood: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          neighborhood: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          neighborhood?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_neighborhoods_user_id_fkey";
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
      place_rating_aggregates: {
        Row: {
          avg_rating: number | null;
          place_id: string | null;
          rating_count: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "place_ratings_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
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
      are_blocked: { Args: { a: string; b: string }; Returns: boolean };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      award_xp: {
        Args: {
          p_amount: number;
          p_reason: string;
          p_reference_id?: string;
          p_reference_type?: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      complete_onboarding: {
        Args: {
          p_avatar_url: string;
          p_city_id: string;
          p_crew_preference: string;
          p_default_check_in_visibility: string;
          p_display_name: string;
          p_genres: string[];
          p_interests: string[];
          p_neighborhoods: string[];
          p_nightlife_pace: string;
          p_travel_radius: string;
          p_username: string;
        };
        Returns: undefined;
      };
      create_notification: {
        Args: {
          p_actor_id: string;
          p_body?: string;
          p_target_id: string;
          p_target_type: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
      evaluate_badges: { Args: { p_user_id: string }; Returns: undefined };
      get_busiest_place_now: {
        Args: { p_city_id: string };
        Returns: {
          check_in_count: number;
          place_address: string;
          place_id: string;
          place_name: string;
        }[];
      };
      get_city_leaderboard: {
        Args: { p_city_id: string; result_limit?: number };
        Returns: {
          avatar_url: string;
          display_name: string;
          outside_streak_current: number;
          rank: number;
          total_xp: number;
          user_id: string;
          username: string;
        }[];
      };
      get_city_outside_count: { Args: { p_city_id: string }; Returns: number };
      get_crew_friends_inside_count: { Args: { p_crew_id: string }; Returns: number };
      get_crew_outside_count: { Args: { p_crew_id: string }; Returns: number };
      get_crew_privacy: { Args: { target_crew_id: string }; Returns: string };
      get_event_attendee_summary: {
        Args: { target_event_id: string };
        Returns: {
          checked_in_count: number;
          going_count: number;
          interested_count: number;
          viewer_status: string;
        }[];
      };
      get_events_with_stats: {
        Args: { p_city_id: string; result_limit?: number };
        Returns: {
          category: string;
          cover_image_url: string;
          description: string;
          end_at: string;
          going_count: number;
          id: string;
          interested_count: number;
          place_id: string;
          place_name: string;
          price_label: string;
          slug: string;
          start_at: string;
          title: string;
          viewer_status: string;
        }[];
      };
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
      get_home_highlight_events: {
        Args: { p_city_id: string; result_limit?: number };
        Returns: {
          cover_image_url: string;
          going_count: number;
          id: string;
          interested_count: number;
          place_id: string;
          place_name: string;
          price_label: string;
          slug: string;
          start_at: string;
          title: string;
          viewer_status: string;
        }[];
      };
      get_my_blocks: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          blocked_at: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      get_my_check_ins: {
        Args: { result_limit?: number };
        Returns: {
          created_at: string;
          event_id: string;
          event_title: string;
          id: string;
          note: string;
          place_id: string;
          place_name: string;
          reaction_count: number;
          viewer_has_reacted: boolean;
          visibility: string;
        }[];
      };
      get_my_crews: {
        Args: { result_limit?: number };
        Returns: {
          avatar_url: string;
          category: string;
          cover_image_url: string;
          friends_inside_count: number;
          id: string;
          member_count: number;
          name: string;
          outside_now_count: number;
          slug: string;
        }[];
      };
      get_my_profile_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          crew_count: number;
          distinct_events: number;
          distinct_places: number;
          longest_outside_streak: number;
        }[];
      };
      get_people_outside_now: {
        Args: { result_limit?: number };
        Returns: {
          avatar_url: string;
          display_name: string;
          is_friend: boolean;
          last_check_in_at: string;
          mutual_friend_count: number;
          place_address: string;
          place_name: string;
          user_id: string;
          username: string;
        }[];
      };
      get_places_with_stats: {
        Args: { p_city_id: string; result_limit?: number };
        Returns: {
          address: string;
          avg_rating: number;
          business_id: string;
          category: string;
          city_id: string;
          cover_image_url: string;
          created_at: string;
          description: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
          popularity_score: number;
          rating_count: number;
          recent_check_in_count: number;
          slug: string;
          updated_at: string;
        }[];
      };
      get_post_by_id: {
        Args: { p_post_id: string };
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
      get_profile_follow_counts: {
        Args: { p_profile_id: string };
        Returns: {
          follower_count: number;
          following_count: number;
        }[];
      };
      get_recommended_crews: {
        Args: { result_limit?: number };
        Returns: {
          avatar_url: string;
          category: string;
          city_id: string;
          cover_image_url: string;
          created_at: string;
          creator_id: string;
          description: string;
          friend_member_count: number;
          id: string;
          member_count: number;
          name: string;
          privacy: string;
          slug: string;
          updated_at: string;
        }[];
      };
      get_recommended_events: {
        Args: { result_limit?: number };
        Returns: {
          category: string;
          cover_image_url: string;
          description: string;
          end_at: string;
          friend_going_count: number;
          going_count: number;
          id: string;
          interested_count: number;
          place_id: string;
          place_name: string;
          price_label: string;
          slug: string;
          start_at: string;
          title: string;
          viewer_status: string;
        }[];
      };
      get_recommended_places: {
        Args: { result_limit?: number };
        Returns: {
          address: string;
          avg_rating: number;
          business_id: string;
          category: string;
          city_id: string;
          cover_image_url: string;
          created_at: string;
          description: string;
          friend_check_in_count: number;
          id: string;
          lat: number;
          lng: number;
          name: string;
          popularity_score: number;
          rating_count: number;
          recent_check_in_count: number;
          slug: string;
          updated_at: string;
        }[];
      };
      get_social_proof: {
        Args: { target: string; viewer: string };
        Returns: {
          is_friend: boolean;
          mutual_friend_count: number;
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
      is_outside_now: { Args: { p_user_id: string }; Returns: boolean };
      level_for_xp: { Args: { p_total_xp: number }; Returns: number };
      search_crews: {
        Args: { p_query: string; result_limit?: number };
        Returns: {
          avatar_url: string;
          category: string;
          id: string;
          member_count: number;
          name: string;
          slug: string;
        }[];
      };
      search_events: {
        Args: { p_city_id: string; p_query: string; result_limit?: number };
        Returns: {
          cover_image_url: string;
          id: string;
          place_name: string;
          slug: string;
          start_at: string;
          title: string;
        }[];
      };
      search_people: {
        Args: { p_query: string; result_limit?: number };
        Returns: {
          avatar_url: string;
          display_name: string;
          id: string;
          username: string;
        }[];
      };
      search_places: {
        Args: { p_city_id: string; p_query: string; result_limit?: number };
        Returns: {
          address: string;
          category: string;
          cover_image_url: string;
          id: string;
          name: string;
          slug: string;
        }[];
      };
      send_event_reminders: { Args: Record<PropertyKey, never>; Returns: undefined };
      send_push_notification: {
        Args: { p_body: string; p_data?: Json; p_title: string; p_user_id: string };
        Returns: undefined;
      };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      touch_outside_streak: {
        Args: { p_activity_date: string; p_user_id: string };
        Returns: undefined;
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
