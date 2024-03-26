const router = require('express').Router();
const { fetch } = require('undici');
const { claimIncludes } = require('express-openid-connect');

router.use(async (req, res, next) => {
  res.locals.user = req.oidc.user;
  res.locals.isAuthenticated = req.oidc.isAuthenticated();

  const user = req.oidc.user;
  try {
    const results = await fetch(`${process.env.GET_USER_METADATA_URL}?user_id=${user.sub}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((res) => res.json());
    // console.log(user);
    console.log(results);
    const keys = Object.keys(results.user_metadata);
    keys.forEach((key) => {
      res.locals.user[key] = results.user_metadata[key];
    });
  } catch (err) {
    console.error(err);
  }
  console.log(res.locals.user);

  // Set the custom NavLinks here
  res.locals.navLinks = [
    {
      label: 'Legacy Hardware Management',
      href: process.env.LEGACY_HARDWARE_MANAGEMENT_URL
    },
    {
      label: 'Legacy Message Manager',
      href: process.env.LEGACY_SCHEDULED_MESSAGES_MANAGEMENT_URL
    }
  ]

  next();
});

router.get('/', (req, res) => {
  res.redirect('/hardware-inventory');
//  res.send('<div><a href="/hardware-inventory">Hardware inventory</a></div>');
});

router.get('/hardware-inventory', async (req, res) => {
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  const url = process.env.HARDWARE_INVENTORY_ITEMS_API_URL;

  let hardwareInventoryItems;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      hardwareInventoryItems = await response.json();
    }
  } catch (err) {
    throw err;
  }

  res.status(200).render(
    'index.pug',
    {
      hardwareInventoryItems
    }
  );
});

router.get('/hardware-inventory/create', claimIncludes('@ycphacks/roles', 'Organizer'), async (req, res) => {

  res.render('./create.pug');
});

router.post('/hardware-inventory/create', claimIncludes('@ycphacks/roles', 'Organizer'), async (req, res) => {
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  const {
    name,
    label,
    category
  } = req.body;

  const url = process.env.HARDWARE_INVENTORY_ITEMS_API_URL;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, label, category })
    });

    if (!response.ok) {
      new Error('AHH!');
    }
  } catch (err) {
    throw err;
  }

  res.redirect(303, '/hardware-inventory');
});

// router.get('/callback', (req, res) => {
//   res.redirect('/');
// });

router.get('/profile', async (req, res) => {
  res.status(200).render('profile.pug');
});

router.post('/profile', async (req, res) => {
  const user = req.oidc.user;

  // Filter out metadata that is not changed
  const filtered_user_metadata = Object.keys(req.body).reduce((acc, key) => {
    console.log(key, user[`@ycphacks/${key}`], req.body[key], req.body[key] !== user[`@ycphacks/${key}`]);
    if (req.body[key] !== user[`@ycphacks/${key}`]) {
      acc[key] = req.body[key];
    }
    return acc;
  }, {});
  console.log(filtered_user_metadata);

  // Trigger Digital Ocean Function
  await fetch(`${process.env.UPDATE_USER_METADATA_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: user.sub,
      user_metadata: filtered_user_metadata
    })
  });

  res.redirect(303, '/profile');
});

router.use((req, res, next) => {
  res.status(404).render('404.pug');
})


module.exports.router = router;
