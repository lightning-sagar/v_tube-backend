import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../models/user.models.js";
import { unploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

 const registerUser = asyncHandler(async (req,res)=>{
    // 1 - get data
    const {fullName,email,username,password} = req.body

    //check field is not empty
    if([fullName,email,username,password].some((field)=>{
        field?.trim() == ""
    })){
        throw new ApiError(400,"all field are required")
    }

    const existUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existUser){
        throw new ApiError(409,"user already exist")
    }

    //to handle images
    console.log(req.files.avatar[0].path);
    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar locally required")
    }
    console.log(avatarLocalPath,"avartar path");
    //upload on cloudinary
    const avatar = await unploadOnCloudinary(avatarLocalPath);
    const coverImage = await unploadOnCloudinary(coverImageLocalPath);
    
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar required")
    }
    
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        // coverImage : coverImage? || "",
        password,
        email,
        username: username.toLowerCase()
    })
    const createdUsername = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUsername){
        throw new ApiError(505,"createdUsername not generate")
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200,createdUsername,"user register")
    )

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logout = asyncHandler(async (req,res)=>{
    try{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1  
                }
            },
            {
                new: true
            }
        )
        const option = {
            httpOnly: true,
            secure : true
        }
        return res.status(200).cookie("accessToken"," ",option).cookie("refreshToken"," ",option).json(
            new ApiResponse(200,"user logout")
        )
    }
    catch(err){
        throw new ApiError(500,err.message)  
    }
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    try {
        const incomingRefreshToken = req.cookie.refreshToken ||req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(400,"kaun h tu bhai, refresh token required")
        }
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = User.findById(decoded?._id)
        if(!user){
            throw new ApiError(404,"user not found")
        }
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(403,"forbidden")
        }
        const option = {
            httpOnly: true,
            secure : true   
        }
        const {accessToken, newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", newrefreshToken, option)
        .json(new ApiResponse(200,{user},"refreshed access token"))
    
    } catch (error) {
        throw new ApiError(500,error.message)
    }
})

const changecurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400,"old password not match")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(new ApiResponse(200,"password changed"))
})

const getcurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user))
})

const updateUser = asyncHandler(async (req,res)=>{
    try {
        const {fullName} = req.body
        const avatarLocalPath = req.files?.path
    
        if(!fullName && !avatar ){
            throw new ApiError(400,"nothing to update")
        }
    
        const avatar = avatarLocalPath ? await unploadOnCloudinary(avatarLocalPath) : req.user.avatar
    
        if(!avatar.url){
            throw new ApiError(400,"avatar required")
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        )
        return res
        .status(200)
        .json(new ApiResponse(200,user))
    } catch (error) {
        throw new ApiError(500,error.message)
    }
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"username required")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user._id, "$subscribedTo"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"user not found")
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"channel profile"))
})

const getwatchHistory = asyncHandler(async (req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)// actual id of user
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        },
        
    ])

    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"watch history"))
})

export  {getwatchHistory,getUserChannelProfile,registerUser,loginUser,updateUser,logout,refreshAccessToken,changecurrentPassword,getcurrentUser}