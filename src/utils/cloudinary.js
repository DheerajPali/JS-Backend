import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    return response;
  } catch (error) {
    // remove the locally saved temperory file as the upload operation got failed.
    console.log("cloudinary :: Error : ", error);
    //we'll unlink file to remove all corrupted file access.
    fs.unlink(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
