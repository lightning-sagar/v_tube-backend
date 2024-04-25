import { Router } from "express";
import {upload} from "../middleware/multer.middleware.js"
import { updateUser, changecurrentPassword, loginUser, logout, refreshAccessToken, registerUser, getcurrentUser, getUserChannelProfile, getwatchHistory } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logout)

router.route("/refresh").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changecurrentPassword)

router.route("/updateUser").patch(verifyJWT,upload.single("avatar"),updateUser)

router.route("/current-user").get(verifyJWT,getcurrentUser)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/histry",).get(verifyJWT,getwatchHistory)

export default router