import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { userAuth } from './interfaces/userAuth';
import { UserDTO } from './dto/create.user.dto';
import { LoginDto } from './dto/login.dto';
import{ userInfoDTO } from './dto/userInfo.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/token.dto';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MessagePattern } from '@nestjs/microservices';

@Injectable()
export class userAuthService {     
    constructor(
        @Inject('userAuth_MODEL') private userAuthModel: Model<userAuth>,
        private jwtService: JwtService,
        private emailService: EmailService
    ) {}
      
    async register(userDTO: UserDTO) {
        try {
            if (userDTO.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            if (userDTO.password === userDTO.username || userDTO.password === userDTO.email) {
                throw new Error('Password must not be the same as the username or email');
            }
            const hashedPassword = await bcrypt.hash(userDTO.password, 10); // 10 is the salt rounds
            const newUser = await this.userAuthModel.create({ ...userDTO, password: hashedPassword });
            const registerToken = this.generateSecureToken();
            newUser.registerToken = registerToken;
            await newUser.save();

            const verificationLink = `http://localhost:3000/user/verifyUser/${registerToken}`;
            await this.emailService.sendRegistrationEmail(newUser.email, verificationLink);

            return { success: true, message: "Registration successful. Please check your email for verification." };
        } catch (error) {
            throw new Error('Failed to register user: ' + (error as Error).message);
        }
}

    
    async verifyUser(token: string): Promise<void> {
        try {
            const user = await this.userAuthModel.findOne({ registerToken: token });
    
            if (!user) {
                throw new HttpException('Invalid verification token', HttpStatus.BAD_REQUEST);
            }
    
            user.registerToken = undefined;
            await user.save();
        } catch (error) {
            throw new HttpException('Invalid verification token', HttpStatus.BAD_REQUEST);
        }
    }
    async validateUser(loginDto:LoginDto){
        let loginResult =await this.userAuthModel.findOne({
            username:loginDto.username,
            password:loginDto.password,
        });

        if(loginResult===null){
            return null;
        }
        
        let jsonData =loginResult.toObject();
        let {_id, ...userData}=jsonData;

        return {
            id:jsonData._id,
            ...userData
        }
    }
    async getUserbyUsername(username:string){
        let loginResult =await this.userAuthModel.findOne({
            username:username,
           
        });

        if(loginResult===null){
            return null;
        }
        let jsonData =loginResult.toObject();
        let {_id, ...userData}=jsonData;

        return {
            id:jsonData._id,
            ...userData
        }
    }
    async login(user: any) {
        try {
            if (!user || !user.email || !user.password) {
                throw new Error("Invalid user data");
            }
            const existingUser = await this.userAuthModel.findOne({ email: user.email });
            if (!existingUser) {
                throw new Error("User not found");
            }
            const isPasswordValid = await bcrypt.compare(user.password, existingUser.password);
    
            if (!isPasswordValid) {
                throw new Error("Invalid email or password");
            }
            const payload = {
                id: existingUser._id,
                email: existingUser.email,
                username: existingUser.username
            };
    
            const token = this.jwtService.sign(payload);
            const tokenDecoded: any = this.jwtService.decode(token);
    
            return {
                success: true,
                access_token: token,
                expires_in: tokenDecoded.exp,
                user_id: existingUser._id 
            };
        } catch (error) {
            return {
                success: false,
                message: (error as Error).message
            };
        }
    }
    
    validateToken(jwt:string){
        const validatedToken = this.jwtService.sign(jwt);
        return validatedToken;
    }
    async getUserinfo(id: string) {
        let userInfo = await this.userAuthModel.findById(id);
    
        if (!userInfo) {
            return null;
        }
    
        let jsonData = userInfo.toObject();
        let { _id, ...userData } = jsonData;
    
        return {
            id: jsonData._id,
            ...userData
        };
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        try {
            const user = await this.userAuthModel.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Invalid current password');
            }

            if (currentPassword === newPassword) {
                throw new Error('New password must be different from the old password');
            }

            if (newPassword.length < 8) {
                throw new Error('New password must be at least 8 characters long');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10); 

            user.password = hashedPassword;

            await user.save();

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            return { success: false, message:  (error as Error).message };
        }
    }

    async editUserInfo(id: string, userInfoDTO:userInfoDTO) {
        try {
            const user = await this.userAuthModel.findById(id);
    
            if (!user) {
                throw new Error("User not found");
            }
    
            if (userInfoDTO.firstName) {
                user.firstName = userInfoDTO.firstName;
            }
            if (userInfoDTO.lastName) {
                user.lastName = userInfoDTO.lastName;
            }
            if (userInfoDTO.email) {
                user.email = userInfoDTO.email;
            }
            if (userInfoDTO.username) {
                user.username = userInfoDTO.username;
            }
            if (userInfoDTO.phoneNum) {
                user.phoneNum = userInfoDTO.phoneNum;
            }
            if (userInfoDTO.company) {
                user.company = userInfoDTO.company;
            }
            if (userInfoDTO.address) {
                user.address = userInfoDTO.address;
            }
            await user.save();
            return { success: true, message: "User information updated successfully" };
        } catch (error) {
            return { success: false,message : (error as Error).message };
        }
    };
    async forgetPassword(email: string) {
        try {
            // Find the user by email
            const user = await this.userAuthModel.findOne({ email });
            
            // If user not found, throw error
            if (!user) {
                throw new Error("User not found");
            }
    
            // Generate reset password token
            const resetPasswordToken = this.generateSecureToken();
    
            // Save the reset password token in the user document
            user.resetPasswordToken = resetPasswordToken;
            await user.save();
    
            // Construct reset password link
            const resetPasswordLink = `http://localhost:3000/forget-password/${resetPasswordToken}`;
    
            // Send reset password email with the reset password link
            await this.emailService.sendResetPasswordEmail(email, resetPasswordLink);
    
            return { success: true, message: "Reset password email sent successfully" };
        } catch (error) {
            return { success: false, message:+ (error as Error).message };
        }
    }
    
    async forgetPasswordT(resetPasswordToken: string, newPassword: string) {
        try {
            const user = await this.verifyTokenAndGetUser(resetPasswordToken);
    
            if (!user) {
                throw new Error("Invalid or expired token");
            }
    
            if (newPassword.length < 8) {
                throw new Error('New password must be at least 8 characters long');
            }
    
            const hashedPassword = await bcrypt.hash(newPassword, 10); 
    
            user.password = hashedPassword;
            await user.save();
    
            return { success: true, message: "Password reset successfully" };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }
    
    
    private async verifyTokenAndGetUser(resetPasswordToken: string) {
        return await this.userAuthModel.findOne({ resetPasswordToken });
    }

    private generateSecureToken(): string {
        return crypto.randomBytes(20).toString('hex');
    }
}