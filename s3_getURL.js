const AWS = require('aws-sdk');

const config = process.env.CONFIG || require('./config.js');

const cloudFront = new AWS.CloudFront.Signer(config.cloudFrontAccessKey, config.privateKey);

module.exports.getURL = (key, path) => {
    
    const promise = new Promise((res, rej) => {
        cloudFront.getSignedUrl({
            url: 'https://d3nmqzakn7wdbu.cloudfront.net/' + path + key,
            expires: Math.floor((new Date()).getTime() / 1000) + (60 * 60 * 1)
        }, (err, url) => {
            if (err)
                rej(err);
            let tempObj = {
                userName: key,
                url: url
            };
            res(tempObj);
        });
    })
    return promise;
}


