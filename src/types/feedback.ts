export type FeedbackRatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

export interface FeedbackItemDto {
  id: string;
  subject: string;
  description: string;
  rating: number;
  isAnonymous: boolean;
  authorName: string;
  createdAt: string;
}

export interface FeedbackFeedResponse {
  items: FeedbackItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
