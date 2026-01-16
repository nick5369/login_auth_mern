import ErrorHandler from "../middleware/error.js"
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

export const register = catchAsyncError(async (req, res, next) => {

    const { name, email, password, phone, verificationMethod } = req.body;
    if (!name || !email || !password || !phone || !verificationMethod) {
        return next(new ErrorHandler("All fields are required !", 400));
    }

    function validatePhoneNumber(phone) {
        const phoneRegex = /^\+91\d{10}$/;
        return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
        return next(new ErrorHandler("Invalid phone number", 400));
    }

    const existingUser = await User.findOne({
        $or: [
            {
                email,
                accountVerified: true,
            },
            {
                phone,
                accountVerified: true,
            }
        ]
    });

    if (existingUser) {
        return next(new ErrorHandler("Phone or email already registered", 400));
    }

    const registrationAttemptsByUser = await User.find({
        $or: [
            { email, accountVerified: false },
            { phone, accountVerified: false }
        ]
    });

    if (registrationAttemptsByUser.length >= 3) {
        return next(new ErrorHandler("Maximum registration attempts exceeded (3). Please try again after an hour.", 400));
    }

    const userData = { name, email, password, phone }
    const user = await User.create(userData);

    const verificationCode = user.generateVerificationCode();
    await user.save();
    await sendVerificationCode(verificationMethod, verificationCode, phone, email);
    res.status(200).json({ success: true });

})

async function sendVerificationCode(verificationMethod, verificationCode, phone, email) {
    
    if (verificationMethod === "email") {
        const message = generateEmailTemplate(verificationCode);
        await sendEmail({email, subject : "Your Verification Code", message});
    }
    else if(verificationMethod === "phone"){
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const verificationCodeWithSpace = verificationCode.toString().split('').join(' ');
        await client.calls.create({
            twiml : `<Response><Say>Your verification code is ${verificationCodeWithSpace}. Your verification code is ${verificationCodeWithSpace}</Say></Response>`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
        })
    } 
    else {
        throw new ErrorHandler("Invalid verification method", 400);
    }
} 


function generateEmailTemplate(verificationCode) {
    return `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
  <div style="background-color: #2563eb; padding: 25px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Confirm Your Identity</h1>
  </div>
  <div style="padding: 30px; color: #444; line-height: 1.6;">
    <p style="font-size: 16px;">Hello,</p>
    <p>To keep your account secure, we need to verify your email address. Use the verification code below to continue:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
      <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1e40af;">${verificationCode}</span>
      <p style="font-size: 12px; color: #64748b; margin-top: 10px; text-transform: uppercase;">Valid for 10 minutes only</p>
    </div>

    <p style="font-size: 14px; color: #666;">If you didn't request this code, you can safely ignore this email or update your security settings.</p>
  </div>
  <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
    &copy; 2025 YourCompany Inc. | 123 Tech Lane, San Francisco
  </div>
</div>`
}

export const verifyOTP = catchAsyncError(async (req, res, next) => {
    const {email,phone,otp} = req.body;
    function validatePhoneNumber(phone){
        const phoneRegex = /^\+91\d{10}$/;
        return phoneRegex.test(phone);
    }
    if(!validatePhoneNumber(phone)){
        return next(new ErrorHandler("Invalid phone number", 400));
    }
    
    const userAllEntries = await User.find({
        $or :[
            {email, accountVerified : false},
            {phone, accountVerified : false}
        ]
    }).sort({createdAt : -1});

    if(!userAllEntries){
        return next(new ErrorHandler("User not found or already verified",400));
    }

    const user = userAllEntries[0];
    if(userAllEntries.length >1){
        await User.deleteMany({
            _id : {$ne : user._id},
            $or : [
                {phone,accountVerified : false},
                {email,accountVerified : false}
            ]
        })
    }

    if(user.verificationCode !== parseInt(otp)){
        return next (new ErrorHandler("Invalid OTP",400));
    }

    if((user.verificationCodeExpire) < Date.now()){
        return next (new ErrorHandler("OTP has expired",400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({validateModifiedOnly:true});
    sendToken(user,200,"Account Verified", res);
});

export const login = catchAsyncError(async (req,res,next) => {
    const {email, password} = req.body;

    if(!email || !password){
        return next(new ErrorHandler("Email and Password are required.",400));
    }

    const user = await User.findOne({
        email, 
        accountVerified : true
    }).select("+password");

    if(!user) {
        return next(new ErrorHandler("Invalid Email or Password",400));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password",400));
    }

    sendToken(user,200,"User logged in successfully",res);
});

export const logout = catchAsyncError( async (req,res,next) => {
    return res.status(200).cookie("token","",{
        expires : new Date(Date.now()),
        httpOnly : true
    }).json({
        success : true,
        message : "User Logged out successfully."
    });
});

export const getUser = catchAsyncError(async (req,res,next)=>{
    const user = req.user;
    return res.status(200).json({
        success:true,
        user,
    });
});

export const forgotPassword = catchAsyncError(async (req,res,next) =>{
    const user = await User.findOne({
        email : req.body.email,
        accountVerified : true
    })
    if(!user){
        return next(new ErrorHandler("User not found.",404));
    }
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave : false});

    const resetPasswordURL = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const message = `Your Reset Passwprd Token is :- \n ${resetPasswordURL} \n\n If you have not requested this email then please ignore it.`

    try {
        await sendEmail({
            email : user.email,
            subject : "MERN AUTHENTICATION APP RESET PASSWORD",
            message
        });
        return res.status(200).json({
            success : true,
            message : `Email sent to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.save({validateBeforeSave : false});
        return next(new ErrorHandler(error.message ? error.message : "Cannot send Email",500));
    }

});

export const resetPassword = catchAsyncError( async (req,res,next)=>{
    const {token} = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire : {$gt : Date.now()},
    });

    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or expired.",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password and Confirm Password do not match.",400));
    }

    user.password = req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordTokenExpire=undefined;
    await user.save();

    sendToken(user,200,"Password changed successfully.", res);

});

