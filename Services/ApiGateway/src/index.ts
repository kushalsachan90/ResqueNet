import express from "express"
import cors from "cors"
import {logger} from "./utils/logger.js"
import dotenv from "dotenv"
import helmet from "helmet"
import {errorHandler} from "./middleware/errorHandler.js"
import proxy from "express-http-proxy"
import {Request} from "express"
dotenv.config()

import {limiter} from "./middleware/rateLimiter.js"

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
   allowedHeaders: ["Content-Type", "Authorization", "X-Device-Id"]  
}))

app.use(helmet());
app.use(limiter);

const proxyOptions={
    proxyReqPathResolver:(req:Request)=>{
        return req.originalUrl.replace(/^\/apiGateway/,"")
    },
  proxyErrorHandler:(err:any,res:any, next:any)=>{
    logger.error("Error occurred while proxying the request", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

app.use("/apiGateway/user",proxy(process.env.USER_SERVICE_URL as string,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
     
        const authHeader = srcReq.headers["authorization"];
        if (authHeader) {
          proxyReqOpts.headers["Authorization"]=srcReq.headers["authorization"] as string
        }
      const deviceId = srcReq.headers["x-device-id"];
    if (deviceId) {
        proxyReqOpts.headers["X-Device-Id"] = deviceId as string
    }
        return proxyReqOpts
    },
    userResDecorator:(proxyRes,proxyResData,srcReq,res)=>{
        res.setHeader("Content-Type", "application/json");
        logger.info(`Request proxied to User Service: ${srcReq.method} ${srcReq.originalUrl}`);
         console.log(`Request received from User Service: ${proxyRes.statusCode} ${srcReq.method} ${srcReq.originalUrl} ${proxyResData.toString()}`);
        return proxyResData
    }
}))

app.use(errorHandler);
const PORT = process.env.PORT
app.listen(PORT, () => {
    logger.info(`API Gateway is running on the port ${PORT}`)
    logger.info(`Proxying requests to User Service at ${process.env.USER_SERVICE_URL}`)
})
