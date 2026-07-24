export type AccountType = 'fisica' | 'ong';
export type DbPostType = 'perdido' | 'encontrado' | 'ong' | 'outro';

export interface DbProfile {
  id: string;
  name: string;
  username: string;
  account_type: AccountType;
  bio?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbPost {
  id: string;
  user_id: string;
  type: DbPostType;
  content: string;
  created_at: string;
  profiles?: DbProfile;
  post_images?: { id: string; image_url: string }[];
  likes?: { id: string; user_id: string }[];
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: DbProfile;
  }[];
}

export interface DbComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: DbProfile;
}
