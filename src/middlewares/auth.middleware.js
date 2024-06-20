
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

//if we're not using our res inside method , then we can just write _ instead of response.
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //we've given permission to access cookie by using cookie-parser in app.js
    //we've saved accessToken and refreshToken in the form of cookie in user.controller.js
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer", "");
    //if user is sending token manually , then we'll search in header. || req.header("Authorization")
      //we're replacing "Bearer" because jwt token format is : Authorization: Bearer <token>
  
      if(!token){
          throw new ApiError(401,"Unauthorized request");
      }
  
      //verify the given token by setted param in user model in .sign like  _id,email etc.
      const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
      //here we can find _id because we've added it jwt in user model.
      const user = await User.findById(decodedToken?._id).select(
          "-password -refreshToken"
      )
  
      if(!user) {
          //Next_video : discuss about frontend.
          throw new ApiError(401, "Invalid Access Token");
      }
  
      //here we're adding user in this request.
      req.user = user;

      //next() means , now run the next method after middleware.
      next();
  } catch (error) {
    throw new ApiError(401, error?.message || 
        "Invalid access token"
    )
  }
});
