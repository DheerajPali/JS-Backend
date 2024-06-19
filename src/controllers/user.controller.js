import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  /*Write down steps to register a user , here you'll get to know about logic building.*/
  // get details (data) from frontEnd , postman etc.
  //galidate data
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
  console.log("fullName : ", fullName);
  console.log("email : ", email);
  console.log("username : ", username);
  console.log("password : ", password);

  //validation.. you can check one by one also , and can use .some method of js as well.

  if (
    [fullName, email, username, password].some((field) => field?.trim() === " ")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //email validation added by me.
  if (!email.contains("@")) {
    throw new ApiError(400, "Enter a valid email");
  }

  //use operators using $ symbol, here we're checking existed user.
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existedUser", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  console.log("From multer *req.files* = ", req.files);
  //multer gives us "req.files" access...

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("avatarLocalPath : ", avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("coverImageLocalPath : ", coverImageLocalPath);

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
    username: username.toLowercase(),
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

  return res.staus(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  );
});

export { registerUser };
