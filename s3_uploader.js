const AWS = require('aws-sdk');
const config = process.env.CONFIG || require('./config.js');
AWS.config.update(config.aws_remote_config);
const s3 = new AWS.S3({});

module.exports.uploadImage = (bufferedFile, title, path) => {
    s3.upload({
        Bucket: "s3886040-images",
        Key: path + title,
        Body: bufferedFile,
        ContentType: 'image/jpg'
    }).promise();
};