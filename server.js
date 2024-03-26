/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */
/*
db.orders.aggregate([
    $lookup:
    {
        from: "movie_table"
        localField: "id in movie table"
        foreignField: "movie id in reviews table"
        as: "movie_reviews"
    }
])
*/
/*
FOR THE POST REVIEWS ROUTE /reviews all you have to do is call the trackDimension only think you will change
is the name of the movie and the actual rating that was passed in

*/
//imports
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
const mongoose = require('mongoose'); 
const { MongoClient } = require('mongodb');
require('dotenv').config();

var app = express();
var router = express.Router();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

//MongoDB connection URI and port
const uri = process.env.DB;
const port = process.env.PORT || 8080;

//connect to MongoDB database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

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

//post /movies route
router.post('/movies', authJwtController.isAuthenticated, (req, res) => {
    const {title, releaseDate, genre, actors } = req.body;
    //check if title in the request body
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    //create new Movie object and save it to the database
    const newMovie = new Movie({ title, releaseDate, genre, actors });

    newMovie.save()
        .then(savedMovie => {
            //send the newly saved movie with success response
            res.status(200).json(savedMovie);
        });
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
// POST route to add a review
router.post('/reviews', authJwtController.isAuthenticated, (req, res) => {
    const { movieId, username, review, rating } = req.body;
    // Create a new review and save it to the database
    const newReview = new Review({ movieId, username, review, rating });
    newReview.save()
        .then(savedReview => {
            res.status(200).json({ message: 'Review created!', review: savedReview });
        })
        .catch(error => {
            console.error('Error saving review:', error);
            res.status(500).json({ error: 'An error occurred while saving the review' });
        });
});

// GET route to retrieve reviews
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

// DELETE route to delete a review (optional)
router.delete('/reviews/:id', authJwtController.isAuthenticated, (req, res) => {
    const { id } = req.params;
    Review.findByIdAndDelete(id)
        .then(deletedReview => {
            if (!deletedReview) {
                return res.status(404).json({ error: 'Review not found' });
            }
            res.status(200).json({ message: 'Review deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting review:', error);
            res.status(500).json({ error: 'An error occurred while deleting the review' });
        });
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


