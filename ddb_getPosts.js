var AWS = require('aws-sdk');
const config = require('./config.js');
AWS.config.update(config.aws_remote_config);
const { getURL } = require('./s3_getURL.js');

var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const dynamo = new AWS.DynamoDB.DocumentClient();

module.exports.getPosts = async (userName) => {
    let friends = await getFriends(userName);
    friends.data.push(userName);
    const promise = new Promise((resolve, reject) => {
        let params = {
            ProjectionExpression: 'userName, post, subject, postId, image',
            TableName: 'Posts'
        };

        ddb.scan(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                let res = [];
                let posts = [];
                let count = 0;
                if (typeof data.Items[0] != 'undefined') {
                    data.Items.forEach(post => {
                        for (var i = 0; i < friends.data.length; i++) {
                            if (friends.data[i] == post.userName.S) {
                                posts.push(post);
                            }
                        }
                    });
                    if (posts.length != 0) {
                        posts.forEach(element => {
                            if (element.image.BOOL) {
                                getURL(element.postId.S, "posts/").then(url => {
                                    count += 1;
                                    element['url'] = url.url;
                                    res.push(element);
                                    // Will resolve when all items complete
                                    // counter-acts async behaviour
                                    if (count === posts.length) {
                                        resolve(res);
                                    }
                                });
                            } else {
                                count += 1;
                                res.push(element);
                                if (count === posts.length) {
                                    resolve(res);
                                }
                            }
                        });
                    } else {
                        resolve(res);
                    }
                } else {
                    resolve(res);
                }
            }
        });
    })
    return promise
};


getFriends = async (userName) => {
    let data = [];
    try {
        let tempData = await dynamo.get({
            TableName: "user",
            AttributesToGet: ["friends"],
            Key: {
                user_name: userName
            }
        }).promise();
        if (Object.keys(tempData.Item).length != 0) {
            data = tempData.Item.friends;
        }
    }
    catch (err) {
        data['error'] = err;
        statusCode = err.statusCode;
    }

    return {
        data
    };
};

