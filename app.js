'use strict';

const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
const axios = require('axios');

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

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', (req, res) => {
    console.log("req.body:  ", req.body);
    axios.post('https://kn71554u02.execute-api.us-east-1.amazonaws.com/prod/lambda-auth', req.body).then(response => {
        console.log(response.data);
        if (response.data.statusCode == 200) {
            req.session.user = {
                user_name: response.data.user_name,
                email: response.data.email
            };
            req.session.loggedIn = true;
            res.render('login');
        } else if (response.data.statusCode == 403) {
            res.render('login', { error: "Password or user name is incorrect!" });
        }
    });
});

app.post('/register', (req, res) => {
    console.log("req.body:  ", req.body);
    axios.post('https://kn71554u02.execute-api.us-east-1.amazonaws.com/prod/lambda-register', req.body).then(response => {
        console.log(response.data);
        if (response.data.statusCode == 200) {
            res.render('login');
        } else if (response.data.statusCode == 400) {
            res.render('register', { error: "User name is taken!" });
        }
    });
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

module.exports = app;