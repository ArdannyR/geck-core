import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';

export const uploadFileToCloudinary = async (filePath, folder = 'VirtualDesk_Files') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      // quality: 'auto',
      // fetch_format: 'auto'
    });

    await fs.unlink(filePath);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      resource_type: result.resource_type
    };
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
};

export const uploadBase64ToCloudinary = async (base64, folder = 'VirtualDesk_AI') => {
  const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    }, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
    stream.end(buffer);
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
};

export const deleteFileFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error en Cloudinary destroy:', error);
    throw error;
  }
};