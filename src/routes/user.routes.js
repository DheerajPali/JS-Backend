import { Router } from "express";
import { loginUser, logoutUser, registerUser ,refreshAccessToken} from "../controllers/user.controller.js";

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

//secured routes   -means asked data in these methods are already checked, 100% data is available
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)


export default router;


 