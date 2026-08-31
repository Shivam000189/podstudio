"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = async (filePath, folder = 'riverside-recordings') => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            resource_type: 'video',
            folder,
        });
        // Delete local file after upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    catch (error) {
        // Clean up local file even if upload fails
        if (fs_1.default.existsSync(filePath))
            fs_1.default.unlinkSync(filePath);
        throw error;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: 'video' });
    }
    catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
