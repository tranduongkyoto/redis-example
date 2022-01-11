const redis = require('redis');
const express = require('express');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

//Set response
const setRespone = (username, repos) => {
  return `<h2>${username} has ${repos} Github repos</h2>`;
};

//Make request to Github for data
const getRepos = async (req, res, next) => {
  try {
    console.log('Fetching data...');

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);
    if (response.status == '404') {
      return res.send('User name invalid');
    }
    const data = await response.json();
    const repos = data.public_repos;
    client.setex(username, 600, repos);

    res.send(setRespone(username, repos));
  } catch (error) {
    console.log(error);
    res.status(500);
  }
};

// Cache middleware
const cache = (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log('Cache hit');
      res.send(setRespone(username, data));
    } else {
      console.log('Caches miss');
      next();
    }
  });
};

//app.get('/repos/:username', getRepos);
app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT} by Duong Ace`);
});
