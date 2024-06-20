import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);


export default router;


 