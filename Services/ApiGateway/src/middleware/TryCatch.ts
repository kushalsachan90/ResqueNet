import { Request, Response, RequestHandler, NextFunction } from 'express'

const TryCatch = (handler: RequestHandler): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error: any) {
            next(error);
        }
    };
};

export default TryCatch; 