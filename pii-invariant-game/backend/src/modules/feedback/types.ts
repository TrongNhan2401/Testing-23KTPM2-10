export interface SubmitFeedbackRequest {
    groupId?: string;
    sessionId?: string;
    rating: number;
    comment?: string;
}

export interface FeedbackResponse {
    id: string;
    groupId: string | null;
    sessionId: string | null;
    rating: number;
    comment: string | null;
    createdAt: string;
}

export interface ListFeedbackRequest {
    sessionId?: string;
    groupId?: string;
    page?: number;
    limit?: number;
}

export interface ListFeedbackResponse {
    entries: FeedbackResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
