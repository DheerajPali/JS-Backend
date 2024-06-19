import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js";

const router = Router();

//this method will be called after a middleware will give control to this route.
router.route("/register").post(
    //here we are using middleware befor executing "registerUser"
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
);

export default router;


 