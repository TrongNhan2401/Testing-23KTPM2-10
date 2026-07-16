import { FeedbackRepository } from "./repository";
import {
    SubmitFeedbackRequest,
    FeedbackResponse,
    ListFeedbackResponse
} from "./types";
import { DuplicateFeedbackError } from "./errors";

export class FeedbackService {
    constructor(private readonly repo: FeedbackRepository) {}

    async submitFeedback(request: SubmitFeedbackRequest): Promise<FeedbackResponse> {
        if (request.sessionId) {
            const existing = await this.repo.findBySessionId(request.sessionId);
            if (existing) {
                throw new DuplicateFeedbackError(request.sessionId);
            }
        }

        const now = new Date();
        const doc = {
            groupId: request.groupId ?? null,
            sessionId: request.sessionId ?? null,
            rating: request.rating,
            comment: request.comment ?? null,
            createdAt: now
        };

        const id = await this.repo.insert(doc);

        return {
            id,
            groupId: doc.groupId,
            sessionId: doc.sessionId,
            rating: doc.rating,
            comment: doc.comment,
            createdAt: now.toISOString()
        };
    }

    async listFeedback(options: {
        sessionId?: string;
        groupId?: string;
        page: number;
        limit: number;
    }): Promise<ListFeedbackResponse> {
        const filter: Record<string, unknown> = {};
        if (options.sessionId) {
            filter.sessionId = options.sessionId;
        }
        if (options.groupId) {
            filter.groupId = options.groupId;
        }

        const skip = (options.page - 1) * options.limit;
        const { data, total } = await this.repo.findAll(
            filter as never,
            {
                sort: { createdAt: -1 },
                skip,
                limit: options.limit
            }
        );

        return {
            entries: data.map(d => ({
                id: d._id.toString(),
                groupId: d.groupId,
                sessionId: d.sessionId,
                rating: d.rating,
                comment: d.comment,
                createdAt: d.createdAt.toISOString()
            })),
            total,
            page: options.page,
            limit: options.limit,
            totalPages: Math.ceil(total / options.limit)
        };
    }
}
