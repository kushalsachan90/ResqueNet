
import { redisClient } from "../config/Redis.js";
import { TryCatch } from "../middleware/TryCatch.js";
import { AppError } from "../utils/Apperror.js";

export const getData = TryCatch(async (req, res) => {

    const { deviceId } = req.body
    const key = `sos:User:${deviceId}`
    const rawdata = await redisClient.get(key)

    if (!rawdata) {
        throw new AppError("No data found", 400)
    }
    const parsedData = JSON.parse(rawdata);

    return res.status(200).json({
        message: "Data found",
        data: parsedData
    })



})