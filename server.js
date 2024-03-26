const express = require('express');
const {
  auth
} = require('express-openid-connect');

const fastify = require('fastify')({
  logger: true
});
const { router } = require('./router.js');
const { publicRouter } = require('./public-router.js');

const app = express();

const port = process.env.PORT;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static('public'));

app.use(publicRouter);

// Configuring the express-openid-client SDK
const authConfig = {
  auth0Logout: true,
  authRequired: true,
  authorizationParams: {
    response_type: 'code',
    audience: 'https://tue-nov-28-api',
    scope: 'openid email profile'
  }
};

app.use(auth(authConfig));

app.use(router);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
