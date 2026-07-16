import { Decimal128 } from "mongodb";
import { AdminQuestionsRepository } from "./repository";
import {
    CreatePiiQuestionRequest,
    PiiQuestionResponse,
    UpdatePiiQuestionRequest,
    CreateInvariantQuestionRequest,
    InvariantQuestionResponse,
    UpdateInvariantQuestionRequest
} from "./types";
import { DuplicateQuestionError, QuestionNotFoundError } from "./errors";

function toPiiResponse(doc: {
    externalId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shipping: string | null;
    correctNotes: boolean;
    correctShipping: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}): PiiQuestionResponse {
    return {
        externalId: doc.externalId,
        fullName: doc.fullName,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
        notes: doc.notes,
        shipping: doc.shipping,
        correctNotes: doc.correctNotes,
        correctShipping: doc.correctShipping,
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
    };
}

function toInvariantResponse(doc: {
    externalId: string;
    items: Decimal128;
    tax: Decimal128;
    shipping: Decimal128;
    totalPrice: Decimal128;
    isViolation: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}): InvariantQuestionResponse {
    return {
        externalId: doc.externalId,
        items: doc.items.toString(),
        tax: doc.tax.toString(),
        shipping: doc.shipping.toString(),
        totalPrice: doc.totalPrice.toString(),
        isViolation: doc.isViolation,
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
    };
}

export class AdminQuestionsService {
    constructor(private readonly repo: AdminQuestionsRepository) {}

    async createPiiQuestion(request: CreatePiiQuestionRequest): Promise<PiiQuestionResponse> {
        const existing = await this.repo.findPiiByExternalId(request.externalId);
        if (existing) {
            throw new DuplicateQuestionError(request.externalId);
        }

        const now = new Date();
        const doc = {
            externalId: request.externalId,
            fullName: request.fullName ?? null,
            email: request.email ?? null,
            phone: request.phone ?? null,
            address: request.address ?? null,
            notes: request.notes ?? null,
            shipping: request.shipping ?? null,
            correctNotes: request.correctNotes,
            correctShipping: request.correctShipping,
            isActive: request.isActive ?? true,
            createdAt: now,
            updatedAt: now
        };

        await this.repo.insertPii(doc);
        return toPiiResponse(doc);
    }

    async listPiiQuestions(isActiveOnly = false): Promise<PiiQuestionResponse[]> {
        const docs = await this.repo.findAllPii(isActiveOnly);
        return docs.map(toPiiResponse);
    }

    async getPiiQuestion(externalId: string): Promise<PiiQuestionResponse> {
        const doc = await this.repo.findPiiByExternalId(externalId);
        if (!doc) {
            throw new QuestionNotFoundError(externalId);
        }
        return toPiiResponse(doc);
    }

    async updatePiiQuestion(
        externalId: string,
        request: UpdatePiiQuestionRequest
    ): Promise<PiiQuestionResponse> {
        const updates: Record<string, unknown> = {};
        if (request.fullName !== undefined) updates.fullName = request.fullName;
        if (request.email !== undefined) updates.email = request.email;
        if (request.phone !== undefined) updates.phone = request.phone;
        if (request.address !== undefined) updates.address = request.address;
        if (request.notes !== undefined) updates.notes = request.notes;
        if (request.shipping !== undefined) updates.shipping = request.shipping;
        if (request.correctNotes !== undefined) updates.correctNotes = request.correctNotes;
        if (request.correctShipping !== undefined) updates.correctShipping = request.correctShipping;
        if (request.isActive !== undefined) updates.isActive = request.isActive;

        const updated = await this.repo.updatePii(externalId, updates);
        if (!updated) {
            throw new QuestionNotFoundError(externalId);
        }

        const doc = await this.repo.findPiiByExternalId(externalId);
        return toPiiResponse(doc!);
    }

    async deletePiiQuestion(externalId: string): Promise<void> {
        const updated = await this.repo.updatePii(externalId, { isActive: false });
        if (!updated) {
            throw new QuestionNotFoundError(externalId);
        }
    }

    async createInvariantQuestion(
        request: CreateInvariantQuestionRequest
    ): Promise<InvariantQuestionResponse> {
        const existing = await this.repo.findInvariantByExternalId(request.externalId);
        if (existing) {
            throw new DuplicateQuestionError(request.externalId);
        }

        const now = new Date();
        const doc = {
            externalId: request.externalId,
            items: Decimal128.fromString(request.items.toString()),
            tax: Decimal128.fromString(request.tax.toString()),
            shipping: Decimal128.fromString(request.shipping.toString()),
            totalPrice: Decimal128.fromString(request.totalPrice.toString()),
            isViolation: request.isViolation,
            isActive: request.isActive ?? true,
            createdAt: now,
            updatedAt: now
        };

        await this.repo.insertInvariant(doc);
        return toInvariantResponse(doc);
    }

    async listInvariantQuestions(isActiveOnly = false): Promise<InvariantQuestionResponse[]> {
        const docs = await this.repo.findAllInvariant(isActiveOnly);
        return docs.map(toInvariantResponse);
    }

    async getInvariantQuestion(externalId: string): Promise<InvariantQuestionResponse> {
        const doc = await this.repo.findInvariantByExternalId(externalId);
        if (!doc) {
            throw new QuestionNotFoundError(externalId);
        }
        return toInvariantResponse(doc);
    }

    async updateInvariantQuestion(
        externalId: string,
        request: UpdateInvariantQuestionRequest
    ): Promise<InvariantQuestionResponse> {
        const updates: Record<string, unknown> = {};
        if (request.items !== undefined) updates.items = Decimal128.fromString(request.items.toString());
        if (request.tax !== undefined) updates.tax = Decimal128.fromString(request.tax.toString());
        if (request.shipping !== undefined) updates.shipping = Decimal128.fromString(request.shipping.toString());
        if (request.totalPrice !== undefined) updates.totalPrice = Decimal128.fromString(request.totalPrice.toString());
        if (request.isViolation !== undefined) updates.isViolation = request.isViolation;
        if (request.isActive !== undefined) updates.isActive = request.isActive;

        const updated = await this.repo.updateInvariant(externalId, updates);
        if (!updated) {
            throw new QuestionNotFoundError(externalId);
        }

        const doc = await this.repo.findInvariantByExternalId(externalId);
        return toInvariantResponse(doc!);
    }

    async deleteInvariantQuestion(externalId: string): Promise<void> {
        const updated = await this.repo.updateInvariant(externalId, { isActive: false });
        if (!updated) {
            throw new QuestionNotFoundError(externalId);
        }
    }
}
