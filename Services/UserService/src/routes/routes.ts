import express from "express";
const router =express.Router();

import UserRequestHandler from "../controller/index.js";

router.post("/accepted",UserRequestHandler);

export default router