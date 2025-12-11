# 🎵 Vinyl Zone

A beautiful, modern web application for managing your vinyl record collection with Auth0 login, Prisma, and a fully animated dark UI.

## ✨ Features

- 📀 **Public Library** - Browse, search, sort, and filter the full vinyl catalog
- 🔒 **Auth0 Login** - Unlock collection, wishlist, and friend views after signing in
- 🎛️ **Personal Dashboards** - Tabs for Library, My Collection, Wishlist, and Friends
- 🏷️ **Collection Tracking** - Store purchase price, condition, notes, and purchase date
- 🌠 **Wishlist & Social** - Save future pickups, follow friends, and view their shelves
- 📝 **Detailed Records** - Tracklist with sides/durations, labels, genres, descriptions
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Instant updates without page refreshes

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm
- MongoDB connection string
- Auth0 application (Regular Web App) for OAuth

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Sanren33/vinylZone.git
   cd vinylZone
   ```

2. **Install dependencies**

   ```bash
   npm run setup
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in:

   ```env
   BASE_URL=http://localhost:3001           # Allowed callback/logout URL in Auth0
   CLIENT_ID=your-auth0-client-id
   ISSUER_BASE_URL=https://your-domain.auth0.com
   SECRET=long-random-string                # Session secret
   DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/vinylzone"
   VERCEL=true                              # Optional for static root routing
   ```

4. **Initialize the database**

   ```bash
   npm run db
   ```

5. **Seed with sample data** (optional)

   ```bash
   npm run seed
   ```

6. **Start the application**

   ```bash
   npm start
   ```

7. **Open your browser**

   Navigate to `http://localhost:3001`

### Auth0 setup notes

- Add `http://localhost:3001` to Allowed Web Origins
- Add `http://localhost:3001/callback` to Allowed Callback URLs
- Add `http://localhost:3001/logout` to Allowed Logout URLs

## 📦 Project Structure

```
vinylZone/
├── middleware/
│   └── auth.js            # Auth0 + Prisma user sync middleware
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Sample data seeder
├── public/
│   ├── index.html         # Main HTML
│   ├── script.js          # UI interactions + API calls
│   └── style.css          # Styles and animations
├── routes/
│   └── api.js             # REST API routes
├── utils/
│   └── prisma.js          # Prisma client helper
├── server.js              # Express server + Auth0 wiring
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── readme.md              # Project readme
```

## 🛠️ Available Scripts

| Command                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `npm run setup`              | Install all dependencies                       |
| `npm start`                  | Start the server on `http://localhost:3001`    |
| `npm run db`                 | Push Prisma schema to MongoDB                  |
| `npm run seed`               | Populate database with sample vinyls           |
| `npx prisma db pull --force` | Pull database schema from an existing database |
| `npx prisma generate`        | Generate Prisma Client from the current schema |

## 🎨 Tech Stack

### Backend

- **Express.js** - Fast, minimalist web framework
- **Prisma** - Next-generation ORM for Node.js
- **Mongo DB** - Lightweight database
- **Auth0** - Authentication and session management (express-openid-connect)

### Frontend

- **Vanilla JavaScript** - No framework overhead
- **CSS3** - Modern styling with gradients, glass, and grid/flex layouts
- **Google Fonts** - Bebas Neue & Libre Baskerville

## 📖 API Endpoints

Base path: `/api`

### Public

- `GET /vinyls` — List vinyls with `search`, `genre`, `sortBy`, `order` query params
- `GET /vinyls/:id` — Fetch a single vinyl with tracks

### Authenticated (requires `/login` via Auth0)

- `GET /user` — Current Auth0 profile + `isAuthenticated`
- `GET /me` — Current user with collection, wishlist, and members

**Collection**

- `GET /me/collection` — Get collection with optional `condition`, `genre`, `vinylId`, `sortBy`, `order`
- `GET /me/collection/by-vinyl/:vinylId` — Collection entry for a vinyl
- `POST /me/collection` — Add vinyl to collection (price, condition, note, purchasedAt)
- `PUT /collection/:id` — Update collection entry (only your own)
- `DELETE /collection/:id` — Remove from collection

**Wishlist**

- `GET /me/wishlist` — Get wishlist with optional `genre`, `sortBy`, `order`
- `POST /me/wishlist` — Add vinyl to wishlist (note optional)
- `DELETE /wishlist/:id` — Remove from wishlist

**Friends**

- `GET /me/members` — List followed friends
- `POST /me/members` — Follow a friend (`friendId`)
- `DELETE /members/:id` — Unfollow
- `GET /members/:friendId/collection` — View a friend’s collection
- `GET /members/:friendId/wishlist` — View a friend’s wishlist

**Vinyl management**

- `POST /vinyls` — Create vinyl with optional tracks
- `PUT /vinyls/:id` — Update vinyl (replaces tracks if provided)
- `DELETE /vinyls/:id` — Delete vinyl
- `POST /vinyls/:id/tracks` — Add a track to an existing vinyl

Example payload for creating a vinyl:

```json
{
  "title": "1989",
  "artist": "Taylor Swift",
  "year": 2014,
  "genre": "Pop",
  "label": "Big Machine Records",
  "description": "Fifth studio album...",
  "tracks": [
    { "side": "A1", "name": "Welcome to New York", "duration": "3:32" }
  ]
}
```

## 🎯 Usage Tips

- Use the **Library** tab to browse and search; sorting defaults to newest added.
- Login to unlock **Add Record**, **My Collection**, **Wishlist**, and **Friends** tabs.
- In Collection, store **price**, **condition**, **notes**, and **purchased date** for each vinyl.
- Wishlist items show up separately from the collection; move them over when purchased.
- Follow friends to view their collections and wishlists inside the Social tab.

## 🎨 Design Features

- Smooth transitions for modal dialogs and tab switches
- Custom scrollbars and responsive grid that adapts to mobile/desktop

## 🔧 Configuration

### Database

- Update `DATABASE_URL` in `.env` with your MongoDB connection string.
- Run `npm run db` after any schema change to sync the database.

### Auth0

- Ensure `BASE_URL`, `CLIENT_ID`, `ISSUER_BASE_URL`, and `SECRET` are set.
- Missing values will stop the server at startup.

### Port

- Defaults to `3001`. Set `PORT` in `.env` if you need a different port.

## 🐛 Troubleshooting

### Database issues

```bash
# Re-push schema and reseed
npm run db
npm run seed
```

### Auth errors on startup

- Confirm all Auth0 env vars are present.
- Verify the callback/logout URLs match `BASE_URL` in your Auth0 app settings.

### Module not found

```bash
rm -rf node_modules
npm run setup
```

## 📝 Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model user {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  auth0Id   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  collections collection[]
  wishlists   wishlist[]
  members member[]
}

model vinyl {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  artist      String
  year        Int?
  label       String?
  genre       String?
  tracks      track[]
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  collections collection[]
  wishlists   wishlist[]
}

model track {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  vinylId  String @db.ObjectId
  vinyl    vinyl  @relation(fields: [vinylId], references: [id], onDelete: Cascade)
  name     String
  duration String
  side     String
}

model collection {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  user        user     @relation(fields: [userId], references: [id], onDelete: Cascade)
  vinylId     String   @db.ObjectId
  vinyl       vinyl    @relation(fields: [vinylId], references: [id], onDelete: Cascade)
  price       Float?
  condition   String?
  note        String?
  purchasedAt DateTime
  createdAt   DateTime @default(now())
  @@unique([userId, vinylId])
}

model wishlist {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)
  vinylId   String   @db.ObjectId
  vinyl     vinyl    @relation(fields: [vinylId], references: [id], onDelete: Cascade)
  addedAt   DateTime @default(now())
  createdAt DateTime @default(now())
  @@unique([userId, vinylId])
}

model member {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)
  friendId  String   @db.ObjectId
  createdAt DateTime @default(now())
  @@unique([userId, friendId])
}
```

## 🎉 Acknowledgments

- Design inspired by classic vinyl records and modern dark UI trends
- Icons from Lucide (via inline SVG)
- Fonts from Google Fonts

---

**Made with ❤️ and vinyl records** 🎵

For questions or support, please open an issue on GitHub.
