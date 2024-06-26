import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        console.log("user inside generat ", user);

        const accessToken = user.generateAccessToken();
        // console.log("accessToken---> ", accessToken)
        const refreshToken = user.generateRefreshToken();
        console.log("refreshToken ")

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};
    }
    catch(error){
        throw new ApiError(500, `${error} , ${error.message}, ${error.name} Something went wrong while generating refresh and access toekn`);
    }

}

const registerUser = asyncHandler( async(req,res) => {
     
    // get user details from front-end
    // validation - not empty
    // check if user already exist: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res if created otherwise error res

    //get user details from front-end
    const {fullName, email, username, password} = req.body;
    //console.log("email ", email);

    // validation
    // if(fullName === ""){
    //     throw new ApiError(400, "full name is required")
    // }

    if([fullName,email,password,username].some((field)=> field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    //already existence
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already existing with same credentials")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path; // file lene ka tareeka hamare local se
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;
   let coverImageLocalPath ;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
   }
   
   if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase() 
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //isse voo doo field nahi aayegi
    )

    if(!createdUser){
        throw new ApiError(500, "Somehing went wrong while registering the user")
    }

    // sending res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )



} )


const loginUser = asyncHandler( async(req,res) => {
    // req body -> data
    // credential are existing or not (username or email) aa rha h ki nhi 
    // find the user
    // password check
    // access and refresh token 
    // send krr doo cookies me 

    // req body -> data
    const {email, username, password} = req.body
    console.log("email - ", email);
    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPsswordValid = await user.isPasswordCorrect(password);

    if(!isPsswordValid){
        throw new ApiError(401,"Password Incorrect");
    }

    console.log("user._id ",user._id);
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user:loggedInUser, accessToken, refreshToken}, "User logged in Successfully")
    )

})


const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})

export {registerUser, loginUser, logoutUser};