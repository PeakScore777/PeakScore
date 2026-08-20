export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  target_score: number;
  average_score: number;
  streak: number;
  simulations: number;
  created_at: string;
}