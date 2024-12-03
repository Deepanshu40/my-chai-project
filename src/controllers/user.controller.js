import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    if (!accessToken || !refreshToken) {
      throw new ApiError(500, "server error in generating tokens");
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "error occured while generating user tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details
  // check if details are received like username, email, password, fullName
  // check if username and email already exist
  // check if avatar file is present
  // upload avatar file and coverfile if available and get their url
  // save the user object
  // check if user saved suceessfully
  // remove password and refreshToken from user object received
  // send the response

  const { fullName, username, email, password } = req.body;
  console.log(req.body);

  if (!fullName || !username || !email || !password) {
    throw new ApiError(
      400,
      `all fields are required like username, email, fullname, password`
    );
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    throw new ApiError(400, `user with same email or username already exist`);
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, `avatar file is required`);
  }

  console.log(avatarLocalPath);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : "";

  if (!avatar) {
    throw new ApiError(500, `error while uploading avatar`);
  }

  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar,
    coverImage,
  });

  if (!user) {
    throw new ApiError(500, `error while saving user to database`);
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, `error while registering user`);
  }

  return res.status(200).json(new ApiResponse(200, createdUser, "success"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get email, password
  // check if above values are available
  // check if user exist with provided email and password,
  // get the user object
  // check if password matches
  // generate access and refresh Token
  // inject access token refresh token in user object
  // send cookies
  // send response

  // console.log(req.body);
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "username or email is required");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (!existedUser) {
    throw new ApiError(
      400,
      "user with provided email or username does not exist"
    );
  }

  const isPasswordCorrect = await existedUser.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "username or password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const getUser = async (req, res) => {};

const logoutUser = async (req, res) => {
  const { _id: userId } = req.user;
  const user = await User.findById(userId);
  user.refreshToken = "";
  await user.save();

  res
    .status(200)
    .cookie("accessToken", "", cookieOptions)
    .cookie("refreshToken", "", cookieOptions)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(400, "unauthorized user");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(400, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "refresh token is used or expired");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(200, { accessToken, refreshToken }, "new tokens generated");
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh Token");
  }
});

export { registerUser, loginUser, getUser, logoutUser, refreshAccessToken };
