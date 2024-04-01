# Movie API

## Explanation

The Movie API assignment is supposed to manage movies and reviews. It lets users perform various operations like signing up, signing in, adding movies, getting movie details, adding reviews, and getting reviews. The API is built using Node.js with Express.js for handling HTTP requests, MongoDB for data storage, and JWT authentication for securing routes.

## Server.js: 

This file contains the main server logic, including route definitions, middleware setup, and database connection.

## Movies.js and Reviews.js: 

These files define the data schemas for movies and reviews. Movies include attributes such as title, release date, genre, and actors, while reviews include details such as the movie ID, reviewer username, review text, and rating.

## Authentication (auth_jwt.js):

This file handles user authentication using JWT tokens. It includes functions for signing up, signing in, and verifying user tokens.

## Installation and Usage

1. Clone this repository to your local machine.
2. Install dependencies by running `npm install`.
3. Set up environment variables by creating a `.env` file in the root directory with the following variables:
   - `DB`: MongoDB connection URI
   - `SECRET_KEY`: Secret key for JWT authentication
   - `GA_KEY`: Google Analytics tracking ID
4. MongoDB needs to be running locally or you can provide the connection URI to a MongoDB Atlas cluster.

## Postman Link
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/32529359-3ebe3288-963c-4459-9c5e-3cab72b40bd6?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D32529359-3ebe3288-963c-4459-9c5e-3cab72b40bd6%26entityType%3Dcollection%26workspaceId%3Dca5832e0-b516-4424-a865-0681292703ce)

## Environment Settings

- **DB**: MongoDB connection URI
- **SECRET_KEY**: Secret key for JWT authentication
- **GA_KEY**: Google Analytics tracking ID

