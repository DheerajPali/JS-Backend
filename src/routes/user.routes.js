import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

//this method will be called after a middleware will give control to this route.
router.route("/register").post(registerUser);

export default router;
 