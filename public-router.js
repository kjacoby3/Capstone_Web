const router = require('express').Router();

router.use((req, res, next) => {
  res.locals.user = req.oidc?.user;
  res.locals.isAuthenticated = req.oidc?.isAuthenticated();
  
  next();
});

router.get('/public', (req, res) => {
  res.status(200).render('public.pug');
});

module.exports.publicRouter = router;