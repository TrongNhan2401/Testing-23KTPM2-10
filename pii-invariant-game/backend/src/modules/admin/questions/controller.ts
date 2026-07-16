import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AdminQuestionsService } from "./service";
import {
    createPiiQuestionSchema,
    updatePiiQuestionSchema,
    piiExternalIdParamSchema,
    createInvariantQuestionSchema,
    updateInvariantQuestionSchema,
    invariantExternalIdParamSchema
} from "./validators";
import {
    DuplicateQuestionError,
    QuestionNotFoundError
} from "./errors";

export class AdminQuestionsController {
    constructor(private readonly service: AdminQuestionsService) {}

    listPiiQuestions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const isActiveOnly = req.query.active === "true";
            const questions = await this.service.listPiiQuestions(isActiveOnly);
            res.status(200).json({
                success: true,
                data: questions
            });
        } catch (err) {
            next(err);
        }
    };

    createPiiQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const body = createPiiQuestionSchema.parse(req.body ?? {});
            const question = await this.service.createPiiQuestion(body);
            res.status(201).json({
                success: true,
                message: "PII question created successfully",
                data: question
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof DuplicateQuestionError) {
                res.status(409).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    updatePiiQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const externalId = piiExternalIdParamSchema.parse(req.params.externalId);
            const body = updatePiiQuestionSchema.parse(req.body ?? {});
            const question = await this.service.updatePiiQuestion(externalId, body);
            res.status(200).json({
                success: true,
                message: "PII question updated successfully",
                data: question
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof QuestionNotFoundError) {
                res.status(404).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    deletePiiQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const externalId = piiExternalIdParamSchema.parse(req.params.externalId);
            await this.service.deletePiiQuestion(externalId);
            res.status(200).json({
                success: true,
                message: "PII question deactivated successfully"
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof QuestionNotFoundError) {
                res.status(404).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    listInvariantQuestions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const isActiveOnly = req.query.active === "true";
            const questions = await this.service.listInvariantQuestions(isActiveOnly);
            res.status(200).json({
                success: true,
                data: questions
            });
        } catch (err) {
            next(err);
        }
    };

    createInvariantQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const body = createInvariantQuestionSchema.parse(req.body ?? {});
            const question = await this.service.createInvariantQuestion(body);
            res.status(201).json({
                success: true,
                message: "Invariant question created successfully",
                data: question
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof DuplicateQuestionError) {
                res.status(409).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    updateInvariantQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const externalId = invariantExternalIdParamSchema.parse(req.params.externalId);
            const body = updateInvariantQuestionSchema.parse(req.body ?? {});
            const question = await this.service.updateInvariantQuestion(externalId, body);
            res.status(200).json({
                success: true,
                message: "Invariant question updated successfully",
                data: question
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof QuestionNotFoundError) {
                res.status(404).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    deleteInvariantQuestion = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const externalId = invariantExternalIdParamSchema.parse(req.params.externalId);
            await this.service.deleteInvariantQuestion(externalId);
            res.status(200).json({
                success: true,
                message: "Invariant question deactivated successfully"
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof QuestionNotFoundError) {
                res.status(404).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    static errorHandler = (
        err: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void => {
        if (res.headersSent) return;
        const msg =
            err instanceof Error ? err.message : "Internal server error";
        // eslint-disable-next-line no-console
        console.error("[admin-questions] unexpected error:", err);
        res.status(500).json({
            success: false,
            message: msg
        });
    };
}
