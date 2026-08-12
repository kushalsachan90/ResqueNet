import {Redis} from "ioredis";
import {logger} from "../utils/logger.js"
import dotenv from "dotenv"
dotenv.config()

export const redisClient=new Redis("redis://:kushal123@localhost:6379")

redisClient.on("connect",()=>{
    logger.info("redis connected successfully")
})

redisClient.on("error",(error:any)=>{
    logger.error("some error occurred in connecting to redis",error)
})
