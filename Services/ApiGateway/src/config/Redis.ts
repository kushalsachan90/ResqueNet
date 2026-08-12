import dotenv from "dotenv";
import {Redis} from "ioredis";
import { logger } from "../utils/logger.js";
dotenv.config();



export const redisClient = new Redis(process.env.REDIS_URL as string);


redisClient.on("connect", () => {
    logger.info("redis connected successfully"); 
});

redisClient.on("error", (error:any) => {
    logger.error("some error occurred in connecting to redis", error);
})