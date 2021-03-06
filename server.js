var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
const { User, Post } = require('./models/models');
// invoke an instance of express application.
var app = express();

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});


// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    next()   
};


// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});


// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/signup.html');
    })
    .post((req, res) => {
        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.redirect('/dashboard');
        })
        .catch(error => {
            res.redirect('/signup');
        });
    });


// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/login.html');
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;

        User.findOne({ where: { username: username } }).then(function (user) {
            if (!user) {
                res.redirect('/login');
            } else if (!user.validPassword(password)) {
                res.redirect('/login');
            } else {
                req.session.user = user.dataValues;
                res.redirect('/dashboard');
            }
        });
    });

// route for post creation
app.route('/create')
.get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/create.html');

})
.post((req, res) => {
    Post.create({
        userId: req.session.user.id,
        body: req.body.body
    })
    .then(
        console.log("post created")
    )
    .then(
        res.redirect('/show')
    )
    .catch(error => {
        res.redirect('/create');
    });
});

// route for post creation
app.route('/delete/:id')
.get(sessionChecker, (req, res) => {
    Post.findOne({ where: { id: req.params.id } })
    .then(result => {
        console.log(result)
        if (result.userId !== req.session.user.id){
            res.send("you do not have permission to delete this post")
        } else {
            Post.destroy({ where: { id: req.params.id } })
            .then(
                console.log("post deleted")
            )
            .then(
                res.redirect('/show')
            )
            .catch(error => {
                console.log("there was an error deleting the post")
                res.redirect('/show');
            });
        }
    }).catch(error => {
        console.log("post not found")
        res.redirect('/show');
    })
});

// route to display list of posts
app.route('/show')
.get(sessionChecker, (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        Post.findAll(
            { where: { userId: req.session.user.id } }
        ).then(function (posts) {
            if (!posts) {
                res.send("No posts")
            } else {
                res.send(posts)
            }
        });
    } else {
        res.redirect('/login');
    }
});


// route for user's dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.sendFile(__dirname + '/public/dashboard.html');
    } else {
        res.redirect('/login');
    }
});


// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});


// start the express server
app.listen(process.env.PORT || 5000)
