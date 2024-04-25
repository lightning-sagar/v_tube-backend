import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

          
// cloudinary.config({ 
//   cloud_name: 'dybgs03yy', 
//   api_key: '332289123789885', 
//   api_secret: 'PuGPKDLd8lTU37vu7MqS9JRtS-I' 
// });
// rember to use your ouwn cloudinary account
const unploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary and woking at line 19 ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log(error,"error part") 
        // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

export { unploadOnCloudinary };