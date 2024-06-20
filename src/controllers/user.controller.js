import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  if (!email || !username) {
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

export { registerUser , loginUser , logoutUser};

