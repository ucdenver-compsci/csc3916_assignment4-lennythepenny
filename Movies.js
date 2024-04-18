var mongoose = require('mongoose');
mongoose.connect(process.env.DB);

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
    // releaseDate: { type: Number, min: [1900, 'Must be greater than 1899'], max: [2100, 'Must be less than 2100']},
    releaseDate: { type: String, required: true }, // Change the type to String
    genre: {
      type: String,
      enum: [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
      ],
    },
    actors: [{
      actorName: String, 
      characterName: String,
    }],
    imageUrl: { type: String }, 
  }, { collection : 'movies' });
  

//return the model
const MovieModel = mongoose.model('Movie', MovieSchema);
module.exports = MovieModel;