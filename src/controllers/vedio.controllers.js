import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const skipVedio = (page - 1) * limit

    const sortvedio = {}

    if (sortBy && sortType) {
        sortingVideo[sortBy] = sortType === "ase" ? 1 : -1;
      } else {
        sortingVideo["createdAt"] = -1;
    }
    if (!userId) {
        throw new ApiError(404, "userId not found");
      }
    
      const aggregation = [
        {
          $match: {
            owner: userId,
          },
        },
        query && {
          $match: query,
        },
        {
          $sort: sortingVideo,
        },
        {
          $skip: skipedVideos,
        },
        {
          $limit: limit,
        },
      ];
    
      const videoList = await Video.aggregate(aggregation);
    
      res
        .status(200)
        .json(new ApiResponse(200, videoList, "successfully get videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if(!title && !description) {
        throw new ApiError(404, "title and description not found")
    }
    const vedioLocalPath = req.file?.videoFile[0].path
    const thumbnailLocalPath = req.file?.thumbnail[0].path

    if(!vedioLocalPath) {
        throw new ApiError(404, "vedio not found")
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(404, "thumbnail not found")
    }

    const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath)
    const videoUrl = await uploadOnCloudinary(vedioLocalPath)
    
    if(!thumbnailUrl && !videoUrl) {
        throw new ApiError(404, "thumbnail and video not found")
    }

    const publishVideo = await Video.create({
        videoFile: videoUrl?.url,
        thumbnail: thumbnailUrl?.url,
        title,
        description,
        duration: videoUrl?.duration,
        isPublished: false,
        owner: req?.user._id,
    });

    if(!publishVideo) {
        throw new ApiError(404, "publish video not found")
    }

    return res.status(200).json(new ApiResponse(200, publishVideo, "successfully publish video"))
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId) {
        throw new ApiError(404, "video id not found")
    }

    const video = await Video.findById({videoId})

    if(!video && !vedio.isPublished(videoId)) {
        throw new ApiError(404, "video not found")
    }
    return res.status(200).json(new ApiResponse(200, video, "successfully get video"))
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const vedio = await Video.findById(videoId)

    if(!vedio && vedioowner !== req.user._id) {
        throw new ApiError(404, "video not found")
    }

    const { title, description } = req.body
    if(!title && !description) {
        throw new ApiError(404, "title and description not found")
    }
    const localthumbnail = req.file?.thumbnail[0].path

    if(!localthumbnail) {
        throw new ApiError(404, "thumbnail not found")
    }
    const thumbnailUrl = await uploadOnCloudinary(localthumbnail)
    if(!thumbnailUrl) {
        throw new ApiError(404, "thumbnail not found")
    }
    const updateVideoDetail = await Video.findByIdAndUpdate(videoId, {
        title,
        description,
        thumbnail: thumbnailUrl?.url
    })

    return res.status(200).json(new ApiResponse(200, updateVideoDetail, "successfully update video"))
    
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video Id not founded");
    }

    const video = await Video.findById(videoId);
    if (!video && video.owner === req?.user._id) {
        throw new ApiError(400, "Video not founded");
    }
    await Video.findByIdAndDelete(videoId, (err, del) => {
        if (err) {
        console.log("Founded an Error in deleting a video : ", +err);
        throw new ApiError(400, "Video Not Deleted Successfully");
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, "Successfully deleted the video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  
    if (!videoId) {
      throw new ApiError(400, "Video Id not founded");
    }
  
    const video = await Video.findById(videoId);
  
    if (!(video && video.owner === req.user?._id)) {
      throw new ApiError(400, "Video not founded");
    }
    const isPublished = !video.isPublished;
  
    const toggleIsPublished = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: { isPublished: isPublished },
      },
      { new: true }
    );
  
    if(!toggleIsPublished){
      throw new ApiError(400, "Something went wrong to toggle the publish state");
    }
  
  
    return res.status(200).json(
      new ApiResponse(200,toggleIsPublished, "Updated toggle state successfully")
    )
  
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}