export type Plan = 'free' | 'basic' | 'premium'
export type FeedbackReaction = 'loved' | 'too_scary' | 'too_long' | 'more_animals' | 'more_adventure'

export interface ChildPreferences {
  interests: string[]
  tone: 'calm' | 'adventurous' | 'educational'
  length: 'short' | 'medium' | 'long'
}

export interface User {
  id: string
  email: string
}

export interface Profile {
  id: string
  display_name: string | null
  locale: string
  gdpr_consent_at: string | null
  plan: Plan
  created_at: string
}

export interface Child {
  id: string
  parent_id: string
  name: string
  age: number
  avatar_color: string
  preferences: ChildPreferences | null
  created_at: string
}

export interface DbStory {
  id: string
  parent_id: string
  child_id: string | null
  title: string
  summary: string | null
  paragraphs: string[]
  theme: string | null
  cover_url: string | null
  image_urls: string[]
  is_template: boolean
  template_id: string | null
  series_id: string | null
  episode_num: number | null
  character_context: unknown | null
  is_branching?: boolean
  story_graph?: unknown | null
  created_at: string
}

export interface DailyStory {
  id: string
  child_id: string
  parent_id: string
  story_date: string
  template_id: string
  story_id: string | null
  is_generated: boolean
  created_at: string
}

export interface UsageQuota {
  user_id: string
  plan: Plan
  monthly_ai_count: number
  monthly_ai_limit: number
  daily_regen_limit: number
  quota_reset_date: string
}

export interface ChildStreak {
  child_id: string
  parent_id: string
  current_streak: number
  longest_streak: number
  last_read_date: string | null
}

export interface ChildStoryMemory {
  child_id: string
  parent_id: string
  last_story_id: string | null
  last_story_title: string | null
  last_story_summary: string | null
  last_story_ending: string | null
  favorite_themes: string[]
  disliked_themes: string[]
  updated_at: string
}

export interface RecurringCharacter {
  id: string
  child_id: string
  parent_id: string
  name: string
  description: string | null
  times_appeared: number
  created_at: string
}

export interface StoryFeedback {
  id: string
  story_id: string
  child_id: string
  parent_id: string
  reaction: FeedbackReaction
  created_at: string
}

export interface StorySeries {
  id: string
  child_id: string
  parent_id: string
  title: string
  description: string | null
  created_at: string
}

export interface MemoryContext {
  last_story_title: string | null
  last_story_summary: string | null
  last_story_ending: string | null
  favorite_themes: string[]
  disliked_themes: string[]
  characters: Array<{ name: string; description: string | null }>
}

export interface DashboardStats {
  totalStories: number
  weeklyStories: number
  monthlyStories: number
  favoriteTheme: string | null
}

export interface StoryNode {
  id: string
  title: string
  summary: string
  text: string[]
  coverImage: string
  images?: string[]
  childName: string
  age: number
  theme: string
  createdAt: string
  characterContext?: unknown[]
  is_branching?: boolean
  story_graph?: BranchingStoryGraph | null
}

export type BranchNodeType = "root" | "leaf"

export interface GraphNode {
  id: string
  type: BranchNodeType
  paragraphs: string[]
  sceneImages: string[]
  audioUrls: string[]
}

export interface StoryChoice {
  label: string
  trait: "brave" | "kind" | "curious" | "creative" | "helpful"
  targetNodeId: string
  preview_text: string
}

export interface BranchingStoryGraph {
  rootNode: GraphNode
  choices: [StoryChoice, StoryChoice]
  leafNodes: GraphNode[]
}
