const AWS = require('aws-sdk');
const config = require('./config.js');
AWS.config.update(config.aws_remote_config);

const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

module.exports.post = (userName, subject, post, postId, imageBool) => {
    const promise = new Promise((resolve, reject) => {
        var params = {
            TableName: 'Posts',
            Item: {
                'postId': { S: postId },
                'subject': { S: subject },
                'post': { S: post },
                'userName': { S: userName },
                'image': {BOOL: imageBool}
            }
        };
        ddb.putItem(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
    return promise
}
