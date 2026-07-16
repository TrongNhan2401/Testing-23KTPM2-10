import { Collection, Db, Filter, FindOptions, ObjectId } from "mongodb";
import {
    FEEDBACK_COLLECTION,
    FeedbackDoc
} from "../shared/database/schemas";

export class FeedbackRepository {
    private readonly feedback: Collection<FeedbackDoc>;

    constructor(db: Db) {
        this.feedback = db.collection<FeedbackDoc>(FEEDBACK_COLLECTION);
    }

    async findById(id: string): Promise<FeedbackDoc | null> {
        return this.feedback.findOne({ _id: new ObjectId(id) } as unknown as Filter<FeedbackDoc>);
    }

    async findBySessionId(sessionId: string): Promise<FeedbackDoc | null> {
        return this.feedback.findOne({ sessionId } as Filter<FeedbackDoc>);
    }

    async insert(doc: Omit<FeedbackDoc, "_id">): Promise<string> {
        const result = await this.feedback.insertOne(doc as FeedbackDoc);
        return (result.insertedId as unknown as ObjectId).toString();
    }

    async findAll(
        filter: Filter<FeedbackDoc>,
        options: FindOptions
    ): Promise<{ data: FeedbackDoc[]; total: number }> {
        const [data, total] = await Promise.all([
            this.feedback.find(filter, options).toArray(),
            this.feedback.countDocuments(filter)
        ]);
        return { data, total };
    }
}
