'use strict';

const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const axios = require('axios');
const crypto = require("crypto");

const AWS = require('aws-sdk');
const config = process.env.CONFIG || require('./config.js');
AWS.config.update(config.aws_remote_config);

const { getURL } = require('./s3_getURL.js');
const uploader = require('./s3_uploader.js');

const ddb_newPost = require('./ddb_newPost.js');
const ddb_getPosts = require('./ddb_getPosts.js');
const { unFriend } = require('./ddb_unFriend.js');

const Multer = require('multer');
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true,
    maxAge: 60000
}));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/user-area', (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/login');
    } else {
        res.render('user-area', { user: req.session.user });
    }
});
app.get('/find-friends', (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/login');
    } else {
        res.render('find-friends', {
            user: req.session.user,
            friends: []
        });
    }
});

app.get('/friends', (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/login');
    } else {
        axios.post('https://ovrzqmw0pj.execute-api.us-east-1.amazonaws.com/prod/lambda-getfriends', { userName: req.session.user.user_name }).then(response => {
            if (response.data.statusCode == 200) {
                let friends = [];
                let count = 0;
                if (typeof response.data.data.Item.friends != 'undefined' && response.data.data.Item.friends.length != 0) {
                    for (var i = 0; i < response.data.data.Item.friends.length; i++) {
                        getURL(response.data.data.Item.friends[i], "profile-pics/").then(url => {
                            friends.push(url);
                            count++;
                            if (count == response.data.data.Item.friends.length) {
                                res.render('friends', {
                                    user: req.session.user,
                                    friends: friends
                                });
                            }
                        });
                    }
                } else {
                    res.render('friends', {
                        user: req.session.user,
                        error: "You have no friends, try adding some?"
                    });
                }
            } else if (response.data.statusCode == 403) {
                res.render('friends', {
                    user: req.session.user,
                    error: "Please reload the page, we experienced an error"
                });
            }
        }).catch(err => {
            console.log(err);
        });
    }
});

app.get('/posts', (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/login');
    } else {
        ddb_getPosts.getPosts(req.session.user.user_name).then(data => {
            let error = '';
            if (data.length == 0) {
                error = 'No posts from you or your friends yet. Try make some?'
            }
            res.render('posts', {
                user: req.session.user,
                posts: data, 
                error: error
            });
        });
        
    }
});

app.post('/searchFriends', (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/login');
    } else {
        axios.post('https://ovrzqmw0pj.execute-api.us-east-1.amazonaws.com/prod/lambda-searchfriends', req.body).then(response => {
            if (response.data.statusCode == 200) {
                let searchItems = [];
                let count = 0;
                if (response.data.data.Count != 0) {
                    for (var i = 0; i < response.data.data.Items.length; i++) {
                        getURL(response.data.data.Items[i].user_name.S, "profile-pics/").then(url => {
                            searchItems.push(url);
                            count++;
                            if (count == response.data.data.Items.length) {
                                res.send({
                                    friends: searchItems
                                });
                            }
                        });
                    }
                } else {
                    res.send({
                        error: "No body found by that name"
                    });
                }
            } else if (response.data.statusCode == 403) {
                res.render('friends', {
                    error: "Please reload the page, we experienced an error"
                });
            }
        }).catch(err => {
            console.log(err);
        });
    }
});

app.post('/unfriend', (req, res) => {
    unFriend(req.session.user.user_name, req.body.index).then(response => {
        res.redirect('/friends');
    })
});

app.post('/friend', (req, res) => {
    axios.post('https://ovrzqmw0pj.execute-api.us-east-1.amazonaws.com/prod/lambda-addfriend', { newFriend: req.body.friend, userName: req.session.user.user_name }).then(response => {
        res.sendStatus(response.data.statusCode);
    }).catch(err => {
        console.log(err);
    });
});

app.post('/register', multer.single('file'), (req, res) => {
    if (req.file) {
        axios.post('https://kn71554u02.execute-api.us-east-1.amazonaws.com/prod/lambda-register', req.body).then(response => {
            if (response.data.statusCode == 200) {
                res.render('login');
                uploader.uploadImage(req.file.buffer, req.body.userName, "profile-pics/");
            } else if (response.data.statusCode == 400) {
                res.render('register', { error: "User name is taken!" });
            }
        }).catch(err => {
            console.log(err);
        });
    } else {
        res.render('register', { error: "Please add profile image!" });
    }

});


app.post('/login', (req, res) => {
    axios.post('https://kn71554u02.execute-api.us-east-1.amazonaws.com/prod/lambda-auth', req.body).then(response => {
        if (response.data.statusCode == 200) {
            req.session.user = {
                user_name: response.data.data.user_name,
                email: response.data.data.email
            };
            req.session.loggedIn = true;
            res.render('user-area', { user: req.session.user });
        } else if (response.data.statusCode == 403) {
            res.render('login', { error: "Password or user name is incorrect!" });
        }
    }).catch(err => {
        console.log(err);
    });
});

app.post('/post', multer.single('file'), (req, res) => {
    const postId = crypto.randomUUID();
    let imageBool = false;
    if (req.file) {
        imageBool = true;
        uploader.uploadImage(req.file.buffer, postId, "posts/");
    }
    ddb_newPost.post(req.session.user.user_name, req.body.subject, req.body.post, postId, imageBool).then(data => {
        ddb_getPosts.getPosts(req.session.user.user_name).then(posts => {
            res.render('posts', {
                user: req.session.user,
                posts: posts
            });
        }); 
    });
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

module.exports = app;