import rateLimit from "express-rate-limit"
import redisStore, { RedisReply } from "rate-limit-redis"
import {logger} from "../utils/logger.js"
import {redisClient} from "../config/Redis.js"
export const limiter=rateLimit({
    windowMs:15*60*1000,      //15 minutes
    max:100,                 // limit each IP to 100 requests per windowMs
    standardHeaders:true,   // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders:false,   // Disable the `X-RateLimit-*` headers
    handler:(req,res)=>{
        logger.error(`Rate limit exceeded for IP:${req.ip}`)
        console.log(req)
      return   res.status(429).json({error: "Too many requests from this IP"})
    },
    store: new redisStore({
    sendCommand: async (...args: any[]): Promise<RedisReply> =>
        await redisClient.call(...(args as [string, ...string[]])) as RedisReply
})

    
})
