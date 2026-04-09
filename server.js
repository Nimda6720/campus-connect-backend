const express = require('express'); 
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

// NEW: Import multer and file system tools for image uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express(); 
app.use(express.json()); 
app.use(cors());

// NEW: Tell Express to expose the 'uploads' folder to the internet so images can be viewed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NEW: Ensure the uploads folder actually exists so the server doesn't crash
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// NEW: Configure where Multer saves the files and what to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-')); 
  }
});
const upload = multer({ storage });

// Connect to MongoDB
const dbURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusConnect';
mongoose.connect(dbURI)
  .then(() => console.log("Local MongoDB Connected Successfully")) 
  .catch(err => console.log("Database connection error: ", err));

// User Blueprint
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" }
});
const User = mongoose.model('User', UserSchema);  

// Meetup Blueprint
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
  eventChat: [{ 
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
});
const Meetup = mongoose.model('Meetup', MeetupSchema); 

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, profilePic } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); 
    const newUser = new User({ name, email, password: hashedPassword, profilePic });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Could not register. Email might exist." });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, name: user.name }, "supersecretkey");
    res.json({ token, user: { id: user._id, name: user.name, profilePic: user.profilePic } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- Meetup Routes ---
app.get('/api/meetups', async (req, res) => {  
  const meetups = await Meetup.find().sort({ _id: -1 });
  res.json(meetups);
});

// NEW: Updated Meetup Creation Route to catch the file upload
app.post('/api/meetups', upload.single('coverImage'), async (req, res) => {
  try {
    // If a file was uploaded, generate the public URL for it. Otherwise, keep it empty.
    const imagePath = req.file 
      ? `https://campus-connect-backend-l3et.onrender.com/uploads/${req.file.filename}` 
      : '';

    const newEntry = new Meetup({
      title: req.body.title,
      category: req.body.category,
      location: req.body.location,
      time: req.body.time,
      description: req.body.description,
      tags: req.body.tags,
      creatorId: req.body.creatorId,
      creatorName: req.body.creatorName,
      coverImage: imagePath // Save the local URL we just generated
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.delete('/api/meetups/:id', async (req, res) => {
  try {
    await Meetup.findByIdAndDelete(req.params.id);
    res.json({ message: "Event Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.put('/api/meetups/:id/join', async (req, res) => {
  try {
    const targetMeetup = await Meetup.findById(req.params.id);
    const userId = req.body.userId; 

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on Port ${PORT}`));