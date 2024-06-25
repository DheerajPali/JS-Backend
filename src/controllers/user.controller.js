import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteOldImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

//here we're creating seprate methods to genereate access and refresh tokens.
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    //await is used by me only , not by mentor
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    //here I'm saving user but mongodb will ask for required fields .
    //so I'm asking it to save without validation . validateBeforeSave : false.
    await user.save({ validateBeforSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /*Write down steps to register a user , here you'll get to know about logic building.*/
  // get details (data) from frontEnd , postman etc.
  //validate data
  //check user already exist, using email and username or custom fields.
  //check for avatar* and image
  //validate for mendatory file
  //upload data into cloudinary
  //check mendatory fileds are uploaded or not
  //create user object
  //remove password and token from response
  //create entry in db
  //check user created or not
  //return response

  //get user details from postman using req.body.
  const { fullName, email, username, password } = req.body;
  console.log("fullname : ", fullName);
  console.log("email : ", email);
  console.log("username : ", username);
  console.log("password : ", password);

  //validation.. you can check one by one also , and can use .some method of js as well.
  if (
    !fullName ||
    !email ||
    !password ||
    !username ||
    [fullName, email, username, password].some((field) => field?.trim() === " ")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //email validation added by me.
  if (!email.includes("@")) {
    throw new ApiError(400, "Enter a valid email");
  }

  //use operators using $ symbol, here we're checking existed user.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existedUser", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  console.log("From multer *req.files* = ", req.files);
  //multer gives us "req.files" access...

  // const avatarLocalPath = req.files?.avatar[0]?.path;

  //here we were directly creating coverImageLocalPath , which will come undefined if file is not there, field is not mendatory so there's no validation.
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  //in coverImageLocalPath we don't want to add "undefined" , so we'll create path only when file exists.
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    var coverImageLocalPath = req.files.coverImage[0].path;
    console.log("coverImageLocalPath : ", coverImageLocalPath);
  }

  //same we'll do for avatar , but not needed beacause we're doing avatar validation in next step.
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    var avatarLocalPath = req.files.avatar[0].path;
    console.log("avatarLocalPath : ", avatarLocalPath);
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //now we need to upload it on cloudinary.

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  console.log("avatar on cloudinary ", avatar);
  console.log("coverImage on cloudinary ", coverImage);

  //create an entry in database, User is interacting with db.
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    //check if coverImage is not there then make it empty , as it's not a required filed.
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  //here we're validating wether user is created or not.
  //also we're removing fileds using .select , this .select method is given by .findById()
  //here you just need to upload the fields which you don't want to select.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  console.log("db entry of user : ", user);

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*write down the steps, how to make logic to make a user login*/
  //Take credentials(input data)
  // validate data(not empty , email is valid etc.)
  //find user in database by email || username
  // verify given password
  // generate access token
  // send access token in the form of cookies
  // return response

  const { username, email, password } = req.body;

  //here you will decide according to your requirement, which param do you want.
  if (!(email || username)) {
    throw new ApiError(400, "please enter email or username");
  }
  //we are finding user by email || username both at a time.
  console.log("email ",email);
  console.log("username ",username);
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //now we've to check password is correct or not.
  //User --> is coming from mongoose, user-->is your user which you got from db.
  //so use "user" here.
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("isPasswordValid",isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  console.log("accessToken : ",accessToken);
  console.log("refreshToken :",refreshToken);

  //here we're removing unwanted data from user.
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  console.log("loggedInUser",loggedInUser)
  
  //how to send token(data) in the form of cookies.

  const options = {
    httpOnly : true,
    secure : true,
    //by making it secure here we're making it not updatable , you can see it but can not modify.
    // it will modify by server only
  }

  //here I'm send cookie in the response. using .cookie
  // you want to send multiple cookies , then write .cookie() multiple times.
  console.log("res",res);

  return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
    new ApiResponse(200,{accessToken,loggedInUser},"User Logged in successfully"));
    // here you can send cookie for user if he wants to store it in his local or he's developing an android app.
    // {
    //   user : loggedInUser,
    //   refreshToken : refreshToken
    // },
    //  "User Logged in successfully"));
});


/* Write steps to logout user*/
//first we'll clear data from cache(cookie)
//we'll reset refreshToken

const logoutUser = asyncHandler(async(req, res) => {
  //we're adding user in req , in our auth.middleware.js

  //findByIdAndUpdate method takes id and fields to update in $set.
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : {
        refreshToken : undefined
      }
    },
    //here we're adding another param in updated value. to verify if needed.
    {
      new : true
    }
  )

  const options = {
    httpOnly : true,
    secure : true
  }

  //check the syntax of .clearCookie() method
  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {} ,"User logged out successfully"));

}); 

//here we'll refresh our access token after session expired.
const refreshAccessToken = asyncHandler( async (req, res) => {
  //first we'll take refreshToken from cookie
  const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError( 401, "Unauthorized request");
  }

  try {

    const decodedToken = jwt.verify(
      incomingToken, 
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError (401, "Invalid refresh token");
    }
  
    if(incomingToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used");
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
  
    const options = {
      httpOnly : true,
      secure : true
    }
  
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken , options)
    .json(
      200,
      {accessToken, refreshToken : newrefreshToken},
      "Access token refreshed"
    )
  } catch (error) {
    throw new ApiError (401 , error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
  const {oldPassword , newPassword, confirmPassword} = req.body;

  if(newPassword === oldPassword){
    throw new ApiError(400, "You can not save new password same as old password");
  }

  if(!(newPassword === confirmPassword)) {
    throw new ApiError( 400, "Please enter confirm password same as new password")
  }

  //check here for "_id" or "id" 
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  
  if(!isPasswordCorrect) {
    throw new ApiError(401 , "Invalid Password");
  }

  user.password = newPassword;
  await user.save({validateBeforSave : false});

  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      {}, 
      "Password changed successfully"
    )
  );
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
  .json(
    new ApiResponse(
      200, 
      await req.user,  //await is added by me only
      "CurrentUser fetched successfully")
  )
})

//here we're updating "Text-Based" data
const updateAccountDetails = asyncHandler( async(req, res) => {
  
  const {fullName , email } = req.body;

  if(!fullName || !email) {
    throw new ApiError (400 , "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        //both are same , fullName : fullName , or in ES6 you can write it 1 time only.
        fullName,
        username,
        email : email 
      }
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse (200, user, "Account details updated successfully"))
})


//How to update file(avatar)
//we'll check wether user is login or not. --auth middleware
//then will use multer -- multer middleware

const updateUserAvatar = asyncHandler( async(req,res) => {

  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) {
    throw new ApiError (500, "Error while uploading avatar")
  }
  //make sure old image is coming here
  const oldAvatar = req.user?.avatar?.url;
  console.log("oldAvatar ", oldAvatar);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        avatar : avatar.url //make sure to fill url here
      }
    },
    {new : true}
  ).select("-password")

  //check wether avatar image changed or not , if yes then delete old image from cloudinary.
  if( oldAvatar && user.avatar.url !== oldAvatar) {
    await deleteOldImageFromCloudinary(oldAvatar);
  }

  return res
   .status(200)
  .json(new ApiResponse(200, user,"Avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler( async(req,res) => {
  const coverImagePath = req.file?.path;
  if(!coverImagePath) {
    throw new ApiError(400 , "Cover image file is missing");
  }
  const coverImage = uploadOnCloudinary(coverImagePath)
  if(!coverImage.url) {
    throw new ApiError(500, "Error while uploading cover image");
  }
  
  //save the url of old image to delete it after update process.
   const oldCoverImage = req.user?.coverImage?.url;
   console.log("oldCoverImage ", oldCoverImage);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        coverImage : coverImage.url,
      }
    },
    {new : true}
  ).select("-password");

  //check wether image is updated or not , delete old image from cloudinary if updated.
  if(oldCoverImage && user.coverImage.url !== oldCoverImage) {
    await deleteOldImageFromCloudinary(oldCoverImage);
  }
  return res
  .status(200)
  .json(new ApiResponse(200, user , "Cover Image updated successfully"));
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
  const {username} = req.params;

  if(!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    //how many docs are here related to our username
    {
      $match : {
        username : username?.toLowerCase()
      },
    },
    //how many people has subscribed you  //pipeline 1
    {
      $lookup : {
        from : "subscriptions", //remeber how your model name will store in mongodb
        localField : "_id",
        foreignField : "channel",
        as : "subscribers"
      }
    },
    //how many channels subscribed by you   //pipeline 2
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField : "subscriber",
        //here Hitesh sir gave name subscribedTo 
        as :"subscribedChannels"
      }
    },
    {
      //here we're adding external(additional) fields  //pipeline 3
      $addFields : {
        //get count on the basis of count of fields using "$size : $fieldName"
        subscriberCount : {
            $size : "$subscribers"
        },
        subscribedChannelsCount : {
          $size : "$subscribedChannels"
        },
        //give flag wether this channel is subscribed or not? check condition , check in subscribers model in subscriber field.
        //use $in to find a value inside array or object. use if then else.
        isSubscribed : {
          $cond : {
            if : {$in : [req.user?._id, "$subscribers.subscriber"]},
            then : true,
            else : false
          }
        }
      }
    },

    //projects says I won't give you all fields, I'll give you selected fields , now give me fields name    //pipeline 4
    {
      $project : {
        fullName : 1,
        email: 1,
        username : 1,
        avatar : 1,
        coverImage : 1,
        subscriberCount: 1,
        subscribedChannelsCount : 1,
        isSubscribed : 1,
        createdAt : 1,
      }
    }
  ]);

  console.log("Channel after aggregation ",channel);

  if(!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
  .status(200)
  .json(
    new ApiResponse (200, channel[0], "User channel fetched successfully")
  )
})



export { 
  registerUser , 
  loginUser , 
  logoutUser ,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
};

