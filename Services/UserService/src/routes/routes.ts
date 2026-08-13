import express from "express";
import UserRequestHandler from "../controller/index.js";
import { getData } from "../controller/getDataRedis.js";
const router = express.Router();



router.post("/accepted", UserRequestHandler);
router.get("/getdata", getData)

export default router