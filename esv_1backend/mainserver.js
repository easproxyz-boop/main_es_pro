require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const redis = require('redis');
const { RedisStore } = require('connect-redis');

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = 'http://localhost:5173';

/* =====================================================
   CORS SETUP
===================================================== */
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

/* =====================================================
   REDIS CLIENT
===================================================== */
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err));

(async () => {
  await redisClient.connect();
  console.log('✅ Redis connected');
})();

/* =====================================================
   SESSION (USING REDIS)
===================================================== */
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if HTTPS
}));

/* =====================================================
   PASSPORT CONFIG
===================================================== */
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const googleName = profile.displayName;
    const googleEmail = profile.emails[0].value;
    const googlePicture = profile.photos[0].value;

    done(null, {
      id: googleId,
      name: googleName,
      email: googleEmail,
      picture: googlePicture,
      accessToken,
      refreshToken
    });
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */
/* function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(`${FRONTEND_URL}/sign-in`);
} */

/* =====================================================
   ROUTES
===================================================== */
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);




app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/sign-in`
  }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/main_`);
  }
);




app.get('/sign-out', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to sign out'
        });
      }

      // Send JSON response instead of redirect
      res.json({
        status: 'success',
        message: 'Signed out successfully',
        redirect: `${FRONTEND_URL}/sign-in`
      });
    });
  });
});


app.post('/revoke/google', async (req, res) => {
  try {
    // Get token (refreshToken preferred, fallback to accessToken)
    const token = req.user.refreshToken || req.user.accessToken;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'No token found for user' });
    }

    // Revoke the token via Google API
    await axios.post(
      `https://oauth2.googleapis.com/revoke?token=${token}`,
      null,
      { headers: { 'Content-type': 'application/x-www-form-urlencoded' } }
    );

    // Logout user and destroy session
    req.logout(() => {
      req.session.destroy(() => {
        res.json({ status: 'success', message: 'Access revoked successfully' });
      });
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to revoke Google access' });
  }
});




/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});

// MIDDLEWARE
const middleware_googleAuthUsersAccess = require('./middleware/googleAuthUsersAccess');
app.use('/', middleware_googleAuthUsersAccess);
// MIDDLEWARE


//INSERT DATA
const insertdata_employee_scan_login_and_logoutS = require('./_1insertdata/scan_login_and_logout/in_and_out')(io);

const insertdata_getstarted_token = require('./_1insertdata/_0getstarted/gs_token_insert')(io);
const insertdata_getstarted_profile = require('./_1insertdata/_0getstarted/gs_profile_insert')(io);
const insertdata_getstarted_completed = require('./_1insertdata/_0getstarted/gs_completed_insert')(io);
const insertdata_useraccount_management_users = require('./_1insertdata/user_account_management/a1f312_insert')(io);
const insertdata_employee_profile_info = require('./_1insertdata/employee_profile_info/a4dst6_insert')(io);

app.use('/', insertdata_employee_scan_login_and_logoutS);


app.use('/', insertdata_getstarted_token);
app.use('/', insertdata_getstarted_profile);
app.use('/', insertdata_getstarted_completed);
app.use('/', insertdata_useraccount_management_users);
app.use('/', insertdata_employee_profile_info);



//INSERT DATA


//GET DATA

const getdata_dtrRoutes = require('./_1getdata/employee_dtr/dtr');

const getdata_employee_profile_info = require('./_1getdata/employee_profile_info/getdata-employee-profile-info-a4dst6');
const getdata_useraccount_management_users = require('./_1getdata/account_management/getdata-useraccount-management-users-8c7x55');
const getdata_office_department = require('./_1getdata/office/office_department');
const getdata_address_town_and_brgy = require('./_1getdata/address/town_and_brgy');

app.use('/', getdata_dtrRoutes);
app.use('/', getdata_employee_profile_info);
app.use('/', getdata_useraccount_management_users);
app.use('/', getdata_office_department);
app.use('/', getdata_address_town_and_brgy);
//GET DATA


//TABLE DATA

const tabledata_useraccount_users = require('./_1tabledata/user_account_management/a1f312_users');
const tabledata_employee_profile_info = require('./_1tabledata/employee_profile_info/uSc233_employee_profile_info');



app.use('/', tabledata_useraccount_users);
app.use('/', tabledata_employee_profile_info);


//TABLE DATA

/* =====================================================
   SOCKET.IO SETUP WITH CORS
===================================================== */
/* Socket.IO */


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Helper function
  const joinRoomOnce = (roomName) => {
    if (socket.rooms.has(roomName)) {
      console.log(`Socket ${socket.id} already in room: ${roomName}`);
      return;
    }

    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  };

  // Join room using email
  socket.on('join_email_room', (email_address) => {
    joinRoomOnce(email_address);
  });

  // Join user account management table room
  socket.on('join_room_table_user_account_a1f312', (table_user_account) => {
    joinRoomOnce(table_user_account);
  });

  // Join employee profile table room
  socket.on('join_room_table_employee_profile_info_uSc233', (table_employee_profile_infoX) => {
    joinRoomOnce(table_employee_profile_infoX);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});




/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
