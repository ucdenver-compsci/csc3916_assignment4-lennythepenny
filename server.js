/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

//imports
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
const crypto = require("crypto");
const rp = require('request-promise');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
const mongoose = require('mongoose'); 
const cors = require('cors');
require('dotenv').config();

var app = express();
var router = express.Router();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cors({
    origin: 'https://csc3916-react-lennythepenny.onrender.com'
}));  

//MongoDB connection URI and port
const uri = process.env.DB;
const port = process.env.PORT || 8080;

//connect to MongoDB database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));
//Google tracking ID for analytics
const GA_TRACKING_ID = process.env.GA_KEY;

//Function to track Google analytics
function trackDimension(category, action, label, value, dimension, metric) {

    var options = { method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs:
            {   // API Version.
                v: '1',
                // Tracking ID / Property ID.
                tid: GA_TRACKING_ID,
                // Random Client Identifier. Ideally, this should be a UUID that
                // is associated with particular user, device, or browser instance.
                cid: crypto.randomBytes(16).toString("hex"),
                // Event hit type.
                t: 'event',
                // Event category.
                ec: category,
                // Event action.
                ea: action,
                // Event label.
                el: label,
                // Event value.
                ev: value,
                // Custom Dimension
                cd1: dimension,
                // Custom Metric
                cm1: metric
            },
        headers:
            {  'Cache-Control': 'no-cache' } };

    return rp(options);
}

//ROUTES
//signup/ route
router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password
        });

        user.save(function(err) {
            if (err) {
                if (err.code === 11000) {
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                }
                else {
                    return res.json(err);
                }
                    
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

//signin/ route
router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

//MOVIE ROUTES
//get /movies route
router.get('/movies', authJwtController.isAuthenticated, (req, res) => {
    //find all the movies in the database
    Movie.find({ title: { $exists: true } })
        .then(movies => {
            res.status(200).json(movies);
        })
        .catch(error => {
            console.error('Error finding movies:', error);
            res.status(500).json({ error: 'An error occurred while fetching movies' });
        });
});

// //post /movies route
// router.post('/movies', authJwtController.isAuthenticated, (req, res) => {
//     const {movieId, title, releaseDate, genre, actors } = req.body;
//     //check if title in the request body
//     if (!title) {
//         return res.status(400).json({ error: 'Title is required' });
//     }
//     //create new Movie object and save it to the database
//     const newMovie = new Movie({ movieId, title, releaseDate, genre, actors });

//     newMovie.save()
//         .then(savedMovie => {
//             //send the newly saved movie with success response
//             res.status(200).json(savedMovie);
//         });
// });
router.post('/movies', authJwtController.isAuthenticated, (req, res) => {
    console.log('Received POST request to /movies:', req.body); // Log the received request body
    
    const {title, releaseDate, genre, actors, imageUrl } = req.body;
    console.log('Parsed request body:', {title, releaseDate, genre, actors, imageUrl }); // Log the parsed request body
    
    //check if title in the request body
    if (!title) {
        console.error('Title is required:', req.body); // Log error if title is missing
        return res.status(400).json({ error: 'Title is required' });
    }
    
    //create new Movie object and save it to the database
    const newMovie = new Movie({title, releaseDate, genre, actors, imageUrl });
    
    newMovie.save()
        .then(savedMovie => {
            console.log('Saved movie to database:', savedMovie); // Log the saved movie
            //send the newly saved movie with success response
            res.status(200).json(savedMovie);
        })
});

//get /movies with specific id route and create array for reviews
router.get('/movies/:id', authJwtController.isAuthenticated, (req, res) => {
    const movieId = req.params.id;

    //checking if query in URL has ?reviews=true
    const includeReviews = req.query.reviews === 'true';
    console.log('Movie ID:', movieId); // Add this line for debugging

    //reviews are requested
    if (includeReviews) {
        //MongoDB aggregation to create movie + it's reviews array
        Movie.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(movieId) } },
            {
                $match: { _id: mongoose.Types.ObjectId(movieId) }
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "movieId",
                    as: "movie_reviews"
                }
            }
        ]).exec(function (err, result) {
            if (err) {
                return res.status(404).json({ error: 'Movie not found' });
            } else {
                res.status(200).json(result);
            }
        });
    } else {
        Movie.findById(movieId)
            .then(movie => {
                if (!movie) {
                    return res.status(404).json({ error: 'Movie not found' });
                }
                res.status(200).json(movie);
            })
            .catch(error => {
                console.error('Error fetching movie:', error);
                res.status(404).json({ error: 'Movie not found' });
            });
    }
});

//put /movies/:title route
router.put('/movies/:title', authJwtController.isAuthenticated, (req, res) => {
    const { title } = req.params;
    const { releaseDate, genre, actors } = req.body;
    //check if title in the request parameters
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
    //find movie from title and update it in the database
    Movie.findOneAndUpdate({ title: title }, { releaseDate, genre, actors }, { new: true })
        .then(updatedMovie => {
            res.status(200).json(updatedMovie);
        })
        .catch(error => res.status(500).json({ error: 'An error occurred while updating the movie' }));
});

//delete /movies/:title route
router.delete('/movies/:title', authJwtController.isAuthenticated, (req, res) => {
    const { title } = req.params;
    //check if title in request parameters
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    Movie.findOneAndDelete({ title: title })
        .then(deletedMovie => {
            if (!deletedMovie) {
                return res.status(404).json({ error: 'Movie not found' });
            }
            res.status(200).json({ message: 'Movie deleted successfully' });
        })
        .catch(error => res.status(500).json({ error: 'An error occurred while deleting the movie' }));
});

//REVIEW ROUTES
//post route to add a review
router.post('/reviews', authJwtController.isAuthenticated, (req, res) => {
    const { movieId, username, review, rating } = req.body;

    //create new review and save it to database
    const newReview = new Review({ movieId, username, review, rating });
    newReview.save()
        .then(savedReview => {
            res.status(200).json({ message: 'Review created!', review: savedReview });
            trackDimension('Feedback', 'Rating', 'Feedback for Movie', '3', 'Guardian\'s of the Galaxy 2', '1')
            .then(function (response) {
                console.log(response.body);
            })
        })
});

//get route to get a review
router.get('/reviews', authJwtController.isAuthenticated, (req, res) => {
        Review.find()
            .then(reviews => {
                res.status(200).json(reviews);
            })
            .catch(error => {
                console.error('Error fetching reviews:', error);
                res.status(500).json({ error: 'An error occurred while fetching reviews' });
            });
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; //for testing only


