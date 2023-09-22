const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//include body-parser for post
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
//include uuid to generate _id (nevermind the format are wrong)
//const { v4: uuidv4 } = require('uuid');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//include crypto to generate _id
const crypto = require('crypto');
//function to generate _id format
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

const userCollection = [];

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const _id = generateId();
  //save the user information into global collection
  const user = { username, _id };
  userCollection.push(user);
  res.json({ username: username, _id: _id });
});

app.get('/api/users', (req, res) => {
  //maybe need to change this once the user have their own logs
  //res.json(userCollection);
  //specify for only the id and username since userCollection have all the attribute
  const result = userCollection.map(user => ({
    _id: user._id,
    username: user.username
  }));
  res.json(result);
});

function formatDate(date) {
  return date
    .toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    .replace(/,/g, '');
}

app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  //find the user in the userCollection by _id
  const user = userCollection.find((i) => i._id === userId);
  if (!user) {
    return res.json({ error: 'user not found' });
  }
  const exercise = {
    username: user.username,
    description,
    duration: parseInt(duration),
    //the funny things is fcc forced to make it as '.toDateString()'
    date: date && date.match(/^\d{4}[-]\d{2}[-]\d{2}$/)
      ? new Date(date).toDateString()
      : new Date().toDateString(),
    /*
    //check if the format is yyyy-mm-dd
    date: date && date.match(/^\d{4}[-]\d{2}[-]\d{2}$/)
      ? formatDate(new Date(date.replace(/-/g, '/')))
      //create new date if date field is empty
      : formatDate(new Date()),
    */
    _id: userId
  };
  //add the exercise to user's log
  if (!user.log) {
    user.log = [];
  }
  user.log.push(exercise);

  //this res.json look like logs
  //res.json(user);

  //make res.json look like all combined
  //this still wrong... what... maybe use (+) operator to combine them but it look so bad. and if its the case i already have other object in my user... count and log...
  //this is confusing... i dont know what the automated test really wanted...

  //timezone offset error and see if that is the problem (try the tests when your local date and the UTC date are the same)
  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  });

  /*const tempUser = {
    username: user.username,
    _id: user._id
  }
  const tempExercise = {
    username: exercise.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: exercise._id
  }
  const combinedObject = {
    ...tempUser,
    ...tempExercise
  };
  res.json(combinedObject);*/
});

app.get('/api/users/:_id/logs', (req, res) => {
  //add param 'from' and 'to' are dates in yyyy-mm-dd format
  //add param 'limit' to limit the logs. also affecting the count
  const userId = req.params._id;
  //const from = req.query.from;
  //const to = req.query.to;
  const limit = parseInt(req.query.limit);

  const user = userCollection.find((i) => i._id === userId);
  user.count = user.log.length;
  if (!user) {
    return res.json({ error: 'user not found' });
  }
  if (!isNaN(limit)) {
    user.log = user.log.slice(0, limit);
    user.count = user.log.length;
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: user.count,
    log: user.log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
