const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION,
});

const generatePresignedUrl = async (directory, fileName) => {
    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${directory}/${fileName}.png`,
        Expires: 1800, 
        ContentType: 'image/png',
        ACL: 'public-read',
    };

    const command = new PutObjectCommand(s3Params);

    try {
        const url = await getSignedUrl(s3Client, command, {
            expiresIn: 1800,
        });
        return url;
    } catch (err) {
        console.error('Error generating presigned URL', err);
        throw err;
    }
};

module.exports = { generatePresignedUrl };
