import { Collection, Db, Decimal128, Filter } from "mongodb";
import {
    PII_QUESTIONS_COLLECTION,
    InvariantQuestionDoc,
    INVARIANT_QUESTIONS_COLLECTION,
    PiiQuestionDoc
} from "../../shared/database/schemas";

export class AdminQuestionsRepository {
    private readonly piiQuestions: Collection<PiiQuestionDoc>;
    private readonly invariantQuestions: Collection<InvariantQuestionDoc>;

    constructor(db: Db) {
        this.piiQuestions = db.collection<PiiQuestionDoc>(PII_QUESTIONS_COLLECTION);
        this.invariantQuestions = db.collection<InvariantQuestionDoc>(INVARIANT_QUESTIONS_COLLECTION);
    }

    async findPiiByExternalId(externalId: string): Promise<PiiQuestionDoc | null> {
        return this.piiQuestions.findOne({ externalId } as Filter<PiiQuestionDoc>);
    }

    async findAllPii(isActiveOnly = false): Promise<PiiQuestionDoc[]> {
        const filter = isActiveOnly
            ? { isActive: true } as Filter<PiiQuestionDoc>
            : {};
        return this.piiQuestions
            .find(filter as Filter<PiiQuestionDoc>)
            .sort({ externalId: 1 })
            .toArray();
    }

    async insertPii(doc: Omit<PiiQuestionDoc, "_id">): Promise<void> {
        await this.piiQuestions.insertOne(doc as PiiQuestionDoc);
    }

    async updatePii(
        externalId: string,
        updates: Partial<PiiQuestionDoc>
    ): Promise<boolean> {
        const result = await this.piiQuestions.updateOne(
            { externalId } as Filter<PiiQuestionDoc>,
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );
        return result.modifiedCount > 0;
    }

    async findInvariantByExternalId(externalId: string): Promise<InvariantQuestionDoc | null> {
        return this.invariantQuestions.findOne({ externalId } as Filter<InvariantQuestionDoc>);
    }

    async findAllInvariant(isActiveOnly = false): Promise<InvariantQuestionDoc[]> {
        const filter = isActiveOnly
            ? { isActive: true } as Filter<InvariantQuestionDoc>
            : {};
        return this.invariantQuestions
            .find(filter as Filter<InvariantQuestionDoc>)
            .sort({ externalId: 1 })
            .toArray();
    }

    async insertInvariant(doc: Omit<InvariantQuestionDoc, "_id">): Promise<void> {
        await this.invariantQuestions.insertOne(doc as InvariantQuestionDoc);
    }

    async updateInvariant(
        externalId: string,
        updates: Partial<InvariantQuestionDoc>
    ): Promise<boolean> {
        const result = await this.invariantQuestions.updateOne(
            { externalId } as Filter<InvariantQuestionDoc>,
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );
        return result.modifiedCount > 0;
    }
}
