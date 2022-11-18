var AWS = require('aws-sdk');
const config = require('./config.js');
AWS.config.update(config.aws_remote_config);

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.unFriend = (userName, index) => {
    const promise = new Promise((resolve, reject) => {
        let params = {
            TableName: 'user',
            Key: { user_name: userName },
            UpdateExpression: `REMOVE friends[${index}]`,
            ReturnValues: "ALL_NEW",
        };
        docClient.update(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    })
    return promise;
};