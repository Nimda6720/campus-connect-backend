<div align="center">

# ⚙️ Campus Connect — Backend

REST API server powering the [Campus Connect](https://campus-connect-frontend-delta.vercel.app) student meetup platform.

[![Frontend Repo](https://img.shields.io/badge/🎓%20Frontend-campus--connect--frontend-1db954?style=for-the-badge)](https://github.com/Nimda6720/campus-connect-frontend)
[![Live App](https://img.shields.io/badge/🚀%20Live%20App-campus--connect-blue?style=for-the-badge)](https://campus-connect-frontend-delta.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render)](https://render.com)

</div>

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (via Mongoose) |
| Authentication | bcryptjs (password hashing) + JWT |
| File Uploads | Multer (disk storage) |
| CORS | cors middleware |
| Deployment | Render |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/register` | `{ name, email, password, profilePic? }` | Create a new user account |
| `POST` | `/api/login` | `{ email, password }` | Authenticate and receive user data |

### Meetups

| Method | Endpoint | Body / Notes | Description |
|--------|----------|------|-------------|
| `GET` | `/api/meetups` | — | Fetch all meetups |
| `POST` | `/api/meetups` | `multipart/form-data` | Create a new meetup (with optional cover image) |
| `PUT` | `/api/meetups/:id/join` | `{ userId }` | Join (or leave) a meetup |
| `DELETE` | `/api/meetups/:id` | — | Delete a meetup |
| `POST` | `/api/meetups/:id/chat` | `{ user, message }` | Post a chat message to a meetup |

### Static Files

| Path | Description |
|------|-------------|
| `GET /uploads/:filename` | Serve uploaded cover images |

---

## 🗃️ Data Models

### User
```js
{
  name:       String  (required),
  email:      String  (required, unique),
  password:   String  (required, bcrypt hashed),
  profilePic: String  (default: "")
}
```

### Meetup
```js
{
  title:       String,
  category:    String,   // "Study" | "Gaming" | "Sports" | "Food"
  location:    String,
  time:        String,
  description: String    (required),
  coverImage:  String    (default: ""),
  tags:        String,
  creatorId:   ObjectId  (ref: User),
  creatorName: String,
  attendees:   [ObjectId],
  chat:        [{ user: String, message: String, timestamp: Date }]
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Install

```bash
git clone https://github.com/Nimda6720/campus-connect-backend.git
cd campus-connect-backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/campusConnect
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### 3. Start the Server

```bash
npm start
```

Server runs at `http://localhost:5000`.

---

## 📁 Project Structure

```
campus-connect-backend/
├── uploads/          # Uploaded cover images (auto-created)
├── server.js         # 🧠 All routes, models, middleware — single-file API
├── package.json
└── .gitignore
```

---

## 🔗 Related

- **Frontend**: [campus-connect-frontend](https://github.com/Nimda6720/campus-connect-frontend) — React 19 app
- **Live App**: [campus-connect-frontend-delta.vercel.app](https://campus-connect-frontend-delta.vercel.app)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
