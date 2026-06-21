export type SpotType = "RIVER" | "LAKE" | "RESERVOIR" | "POND" | "BLACK_PIT" | "SEA" | "OTHER";
export type FeeType = "free" | "paid" | "unknown";
export type UserRole = "USER" | "ADMIN";
export type SpotVisibility = "PRIVATE" | "PUBLIC";
export type ReviewStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type SpotOperationType = "CREATE" | "UPDATE" | "DELETE";
export type SpotFormType = "RIVER" | "LAKE" | "RESERVOIR" | "POND" | "BLACK_PIT" | "SEA" | "OTHER";
export type SpotFormFeeType = "FREE" | "PAID" | "UNKNOWN";

export interface FishingSpot {
  id: string;
  name: string;
  type: SpotType;
  typeLabel: string;
  coverUrl: string;
  distanceKm: number;
  fishSpecies: string[];
  rating: number;
  reviewCount: number;
  postCount?: number;
  latitude: number;
  longitude: number;
  coordinateText?: string;
  city?: string;
  district?: string;
  address: string;
  isRecommended?: boolean;
  feeType?: FeeType;
  feeAmount?: number;
  parking?: boolean;
  nightFishing?: boolean;
  heat?: number;
  creatorId?: string;
  currentUserIsCreator?: boolean;
  currentUserCanManage?: boolean;
  hasPendingReview?: boolean;
  pendingReviewId?: string;
  visibility?: SpotVisibility;
  reviewStatus?: ReviewStatus;
  isMine?: boolean;
  isFavorite?: boolean;
}

export interface SpotReview {
  id: string;
  spotId: string;
  userId: string;
  author?: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    level?: number;
  };
  rating: number;
  content?: string;
  createdAt: string;
  createdAtText?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  level: number;
  followerCount: number;
  followingCount: number;
  likedCount: number;
  role: UserRole;
}

export interface CommunityPost {
  id: string;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string;
    level: number;
    city?: string;
    followed: boolean;
  };
  content: string;
  images: string[];
  createdAt: string;
  createdAtText?: string;
  spot?: {
    id: string;
    name: string;
  };
  waterType?: string;
  tags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  liked: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  author?: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    level?: number;
  };
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface PublishForm {
  type: "catch" | "spot" | "post";
  content: string;
  images: string[];
  spotId?: string;
  latitude?: number;
  longitude?: number;
  fishSpecies?: string[];
  weightKg?: number;
  lengthCm?: number;
  bait?: string;
  rod?: string;
  tags: string[];
  visibility: "public" | "followers" | "private";
}

export interface SpotFormData {
  name: string;
  type: SpotFormType;
  description: string;
  province: string;
  city: string;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  coverUrl: string;
  imageUrls: string[];
  fishSpecies: string[];
  feeType: SpotFormFeeType;
  feeAmount?: number | null;
  parkingSupported: boolean;
  nightFishingSupported: boolean;
  visibility: SpotVisibility;
}

export interface MySpotItem {
  id: string;
  name: string;
  coverUrl?: string;
  typeLabel?: string;
  address?: string;
  visibility: SpotVisibility;
  reviewStatus: ReviewStatus;
  latestOperationType?: SpotOperationType;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface MySpotDetail extends MySpotItem {
  type?: SpotFormType;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  fishSpecies: string[];
  feeType: SpotFormFeeType;
  feeAmount?: number | null;
  parkingSupported: boolean;
  nightFishingSupported: boolean;
  pendingReviewId?: string;
  hasPendingReview?: boolean;
}

export interface SpotReviewTask {
  id: string;
  operationType: SpotOperationType;
  reviewStatus: ReviewStatus;
  spotId?: string;
  spotName: string;
  coverUrl?: string;
  submitter: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  rejectReason?: string;
  version: number;
}

export interface SpotReviewDetail extends SpotReviewTask {
  reviewer?: {
    id: string;
    nickname: string;
  };
  deleteReason?: string;
  before?: Partial<SpotFormData>;
  after?: Partial<SpotFormData>;
}
