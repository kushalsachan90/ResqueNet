
import {  Request, Response } from "express"
import { AppError } from "../utils/Apperror.js"
import { TryCatch } from "../middleware/TryCatch.js"
import {redisClient} from "../config/Redis.js"


const UserRequestHandler = TryCatch(async (req: Request, res: Response) => {
    const { accuracy, latitude, longitude, description,timestamp } = req.body
    const deviceId = req.headers["x-device-id"] as string
 
      if(!deviceId){
        throw new AppError("Missing deviceId",400)
      }
    if (!accuracy || !latitude || !longitude || !description) {
        throw new AppError("Missing required fields", 400)
    }
     const key=`User:${deviceId}`
     const COOL_DOWN_SECONDS=5*60
      const cooldownKey=`sos:User:${deviceId}`
      const iscooldownKeyExist=await redisClient.exists(cooldownKey)
        
      if(iscooldownKeyExist){
          const ttl=await redisClient.ttl(cooldownKey)
          return res.status(429).json({
             error: "Please wait before resending",
             retryAfterSeconds: ttl,
          }) 
      }

      await redisClient.set(cooldownKey,"1","EX",COOL_DOWN_SECONDS)
     const alreadyExits= await redisClient.exists(key)
     if(alreadyExits){
        return res.json({
            messages:"Request all ready received"
     })
     }
    const data={
        accuracy,
        latitude,
        longitude,
        description,
        timestamp
    }
 
  await redisClient.set(key,JSON.stringify(data),"EX",24 * 60 * 60)    
     
     res.json({ etaMinutes: null, message: "SOS received" });
})

export default UserRequestHandler