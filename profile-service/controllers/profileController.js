const Profile = require('../models/Profile');
const axios = require('axios');

// Get profile by user ID
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or update profile
exports.updateProfile = async (req, res) => {
  try {
    const { bio, avatar, website, location, social } = req.body;
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify the token with auth service
    try {
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { 'x-auth-token': token }
      });
      
      const { user } = authResponse.data;
      
      // Check if profile exists
      let profile = await Profile.findOne({ userId: user.id });
      
      if (!profile) {
        // Create a new profile
        profile = new Profile({
          userId: user.id,
          bio: bio || '',
          avatar: avatar || '',
          website: website || '',
          location: location || '',
          social: social || {
            twitter: '',
            facebook: '',
            linkedin: '',
            instagram: ''
          }
        });
      } else {
        // Update existing profile
        profile.bio = bio || profile.bio;
        profile.avatar = avatar || profile.avatar;
        profile.website = website || profile.website;
        profile.location = location || profile.location;
        
        if (social) {
          profile.social = {
            twitter: social.twitter || profile.social.twitter,
            facebook: social.facebook || profile.social.facebook,
            linkedin: social.linkedin || profile.social.linkedin,
            instagram: social.instagram || profile.social.instagram
          };
        }
        
        profile.updatedAt = Date.now();
      }
      
      await profile.save();
      res.status(200).json(profile);
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify the token with auth service
    try {
      const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { 'x-auth-token': token }
      });
      
      const { user } = authResponse.data;
      
      // Find the profile
      const profile = await Profile.findOne({ userId: user.id });
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      await Profile.findOneAndDelete({ userId: user.id });
      res.status(200).json({ message: 'Profile deleted successfully' });
    } catch (error) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 