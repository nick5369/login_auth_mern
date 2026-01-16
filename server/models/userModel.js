import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema  = new mongoose.Schema({
    name : String,
    email : String,
    password : {
        type : String,
        minLength : [8, "Password should be at least 8 characters long"],
        maxLength : [32, "Password should not exceed 32 characters"],
        select : false
    },
    phone : String,
    accountVerified : { type : Boolean, default : false},
    verificationCode : Number,
    verificationCodeExpire : Date,
    resetPasswordToken : String,
    resetPasswordTokenExpire : Date,
    createdAt : {
        type : Date,
        default : Date.now,
    },
});

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password);
};

userSchema.methods.generateVerificationCode = function(){
    function generateRandomFiveDigitCode(){
        const firstDigit = Math.floor(Math.random() * 9) + 1; // Ensure first digit is not zero
        const otherDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return parseInt(firstDigit.toString() + otherDigits);
    }
    const code = generateRandomFiveDigitCode();
    this.verificationCode = code;
    this.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    return code;
}

userSchema.methods.generateToken = function(){
    return jwt.sign({id : this._id},process.env.JWT_SECRET_KEY, {
        expiresIn : process.env.JWT_EXPIRE
    })
}

userSchema.methods.generateResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordTokenExpire = Date.now() + 15*60*1000;

    return resetToken;
}

export const User = mongoose.model("User", userSchema);