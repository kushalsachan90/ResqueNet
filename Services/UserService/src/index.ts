import express from "express";
import dotenv from "dotenv"
import { logger } from "./utils/logger.js";
import routes from "./routes/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
dotenv.config()

const app=express();

app.use(express.json())


const PORT=process.env.PORT

app.use("/user",routes)
app.use(errorHandler)

app.listen(PORT,()=>{
    logger.info(`UserService is running on port ${PORT}`)
    console.log(`user service is running on port ${PORT}`)
})

