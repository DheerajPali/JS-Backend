import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("cloudinary : localFilePath not found");
      return null;
    }
    console.log("LocalFilePath *** ", localFilePath);
    //upload the file of cloudinary;
    const response = await cloudinary.uploader.upload(localFilePath, {
      //here you can ask for specific file like audio, video,image etc.
      resource_type: "auto",
    });

    //file has been uploaded successfully
    console.log(
      "file is uploaded on cloudinary, file url : ",
      response.url,
      "file info : ",
      response
    );
    //it will delete the uploaded file "Syncronomously" , after successfull uploadition of the file.
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // remove the locally saved temperory file as the upload operation got failed.
    console.log("cloudinary :: Error : ", error);
    //we'll unlink file to remove all corrupted file access.
    fs.unlinkSync(localFilePath);
    return null;
  }
};

//this method is created by me , so please check it. It was my assignment
const deleteOldImageFromCloudinary = async (oldImageFilePath) => {
  try {
    if (!oldImageFilePath) {
      console.log("File not deleted ,oldImageFilePath not found");
      return null;
    }

    if (!oldImageFilePath.public_id) {
      console.log("File does not exist on cloudinary");
      return null;
    }
    const response = await cloudinary.uploader.destroy(
      oldImageFilePath.public_id
    );
    console.log("Image Successfully deleted from cloudinary");
    return response;
  } catch (error) {
    console.log("Error deleting file from Cloudinary : ", error);
  }
};
export { uploadOnCloudinary, deleteOldImageFromCloudinary };
