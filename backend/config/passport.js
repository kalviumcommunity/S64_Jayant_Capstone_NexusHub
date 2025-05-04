const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/userModel');
const crypto = require('crypto');

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - Only configure if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET) {
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // If user exists but was not created with Google OAuth
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // Create new user if doesn't exist
          const randomPassword = crypto.randomBytes(16).toString('hex');
          
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            username: profile.emails[0].value.split('@')[0] + crypto.randomBytes(4).toString('hex'),
            password: randomPassword,
            isEmailVerified: true, // Auto-verify email for OAuth users
            profilePicture: profile.photos[0]?.value || 'default-avatar.png'
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('Google OAuth credentials not provided or using placeholders. Google authentication is disabled.');
}

// GitHub OAuth Strategy - Only configure if credentials are provided
if (process.env.GITHUB_CLIENT_ID && 
    process.env.GITHUB_CLIENT_SECRET) {
  
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Get primary email from GitHub profile
          let primaryEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          // If no email is available, we can't proceed
          if (!primaryEmail) {
            return done(new Error('No email available from GitHub profile'), null);
          }
          
          // Check if user already exists
          let user = await User.findOne({ email: primaryEmail });

          if (user) {
            // If user exists but was not created with GitHub OAuth
            if (!user.githubId) {
              user.githubId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // Create new user if doesn't exist
          const randomPassword = crypto.randomBytes(16).toString('hex');
          
          user = await User.create({
            githubId: profile.id,
            email: primaryEmail,
            name: profile.displayName || profile.username,
            username: profile.username + crypto.randomBytes(4).toString('hex'),
            password: randomPassword,
            isEmailVerified: true, // Auto-verify email for OAuth users
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : 'default-avatar.png',
            socialLinks: {
              github: profile.profileUrl
            }
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log('GitHub OAuth credentials not provided or using placeholders. GitHub authentication is disabled.');
}

module.exports = passport;