import { logger } from "../utils/logger.js";
import { AppError } from "../utils/Apperror.js";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ error: "Internal Server Error" });
};