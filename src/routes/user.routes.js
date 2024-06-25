import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser ,
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory
}  from "../controllers/user.controller.js";

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
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT,changeCurrentPassword);

//here we're not sending anything , so we'll make it get request. 
router.route("/current-user").get(verifyJWT,getCurrentUser)

//here we're updating some details only , that's why we'll use patch request.
router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar);

router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

//here we're getting value from params instead of body
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/watch-history").get (verifyJWT , getWatchHistory)

export default router;


 