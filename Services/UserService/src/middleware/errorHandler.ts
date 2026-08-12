import { logger } from "../utils/logger.js";
import { AppError } from "../utils/Apperror.js";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, { stack: err.stack });

    if (err instanceof AppError) {
        logger.error(`AppError: ${err.message}`, { stack: err.stack });
        return res.status(err.statusCode).json({ message: err.message });
    }

    logger.error("Internal Server Error", { stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
};