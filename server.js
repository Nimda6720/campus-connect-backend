const express = require('express'); // that's how you import something in node.js 
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const app = express(); // create an instance of express, which is our server just like creating objects in OOP
app.use(express.json()); // express is the middleman that will handle the request and response
app.use(cors());// handles security issues between frontend and backend 

// Connect to MongoDB (Cloud or Local)
const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusConnect';
mongoose.connect(dbURI)
  .then(() => console.log("Local MongoDB Connected Successfully")) // then and catch is like try and catch from OOP 
  .catch(err => console.log("Database connection error: ", err));

// User Blueprint
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);  

// Define the blueprint for a Meetup
const MeetupSchema = new mongoose.Schema({
  title: String,
  category: String,
  location: String,
  time: String,
  description: { type: String, required: true },
  coverImage: { type: String, default: "" },
  tags: { type: String, default: "" },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creatorName: String,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  eventChat: [{ // NEW: Array to hold all messages for this specific event
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
});
const Meetup = mongoose.model('Meetup', MeetupSchema); //.model is like creating a class in OOP like a template 

// --- NEW: Auth Routes ---
// 1. Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, profilePic } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Scramble password
    const newUser = new User({ name, email, password: hashedPassword, profilePic });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Could not register. Email might exist." });
  }
});

// 2. Login an existing user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Give them a digital ID card (Token)
    const token = jwt.sign({ id: user._id, name: user.name }, "supersecretkey");
    res.json({ token, user: { id: user._id, name: user.name, profilePic: user.profilePic } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Create a route to get all meetups
app.get('/api/meetups', async (req, res) => {  
  const meetups = await Meetup.find().sort({ _id: -1 });
  res.json(meetups);
});

// Create a route to post a new meetup
app.post('/api/meetups', async (req, res) => {
  try {
    const newEntry = new Meetup(req.body);
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Delete a meetup (NEW FEATURE: Requires frontend to send the correct ID)
app.delete('/api/meetups/:id', async (req, res) => {
  try {
    await Meetup.findByIdAndDelete(req.params.id);
    res.json({ message: "Event Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Join a meetup (Same as your previous implementation)
app.put('/api/meetups/:id/join', async (req, res) => {
  try {
    const targetMeetup = await Meetup.findById(req.params.id);
    const userId = req.body.userId; // Expecting the frontend to send the user's ID


    if (targetMeetup.attendees.includes(userId)) {
      targetMeetup.attendees = targetMeetup.attendees.filter(id => id.toString() !== userId);
    } else {
      targetMeetup.attendees.push(userId);
    }
    
    await targetMeetup.save();
    res.json(targetMeetup);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle join status" });
  }
});

// Chat Section
app.post('/api/meetups/:id/chat', async (req, res) => {
  try {
    const targetMeetup = await Meetup.findById(req.params.id);
    targetMeetup.eventChat.push({
      user: req.body.user,
      message: req.body.message
    }); 
    await targetMeetup.save();
    res.json(targetMeetup);
  } catch (err) {
    res.status(500).json({ error: "Failed to post message" });
  }
});

// Start the server
app.listen(5000, () => console.log("Backend server running on Port 5000"));