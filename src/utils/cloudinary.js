import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(
      `file has been uploaded successfully on cloudinary`,
      response.url
    );
    fs.unlinkSync(localFilePath); //removing locally saved file
    return response?.url;
  } catch (error) {
    fs.unlinkSync(localFilePath); //removing locally saved file
    console.log(`error occured while uploading file`, error);
    return null;
  }
};

export { uploadOnCloudinary };
