# 🎵 Vinyl Zone

A beautiful, modern web application for managing your vinyl record collection. Built with Express.js, Prisma, and vanilla JavaScript with a stunning dark theme and smooth animations.

## ✨ Features

- 📀 **Collection Management** - Add, edit, view, and delete vinyl records
- 🔍 **Smart Search** - Search across titles, artists, and albums
- 🎨 **Filter & Sort** - Filter by genre, sort by title, artist, year, or date added
- 📝 **Detailed Tracking** - Track complete information including:
  - Title, Artist, Year, Label, Genre
  - Full tracklist with side notation (A1, A2, B1, etc.)
  - Duration for each track
  - Custom descriptions
- 🎭 **Beautiful UI** - Dark theme with teal/mint accents and smooth animations
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Instant updates without page refreshes

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Sanren33/vinylZone.git
   cd vinylzone
   ```

2. **Install dependencies**

   ```bash
   npm run setup
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="mongodb_url"
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

## 📦 Project Structure

```
vinylzone/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Sample data seeder
├── public/
│   ├── index.html         # Main HTML file
│   └── style.css          # Stylesheet
├── routes/
│   └── api.js             # API Request
├── public/
│   └── prisma.js          # Prisma client
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables
└── README.md              # Readme
```

## 🛠️ Available Scripts

| Command                      | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `npm run setup`              | Install all dependencies                     |
| `npm start`                  | Start the development server with hot reload |
| `npm run db`                 | Push database schema to SQLite               |
| `npm run seed`               | Populate database with sample records        |
| `npx prisma db pull --force` | Pull database schema from existing database  |
| `npx prisma generate`        | Generate Prisma Client from schema           |

## 🎨 Tech Stack

### Backend

- **Express.js** - Fast, minimalist web framework
- **Prisma** - Next-generation ORM for Node.js
- **Mongo DB** - Lightweight database

### Frontend

- **Vanilla JavaScript** - No framework overhead
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Google Fonts** - Bebas Neue & Libre Baskerville

## 📖 API Endpoints

### GET `/vinyls`

Get all vinyl records with optional filtering and sorting

**Query Parameters:**

- `search` - Search in title, artist, label
- `genre` - Filter by genre
- `sortBy` - Sort by: `title`, `artist`, `year`, `createdAt`
- `order` - Order: `asc` or `desc`

**Example:**

```
GET /vinyls?genre=Rock&sortBy=year&order=desc
```

### GET `/vinyls/:id`

Get a single vinyl record by ID

### POST `/vinyls`

Create a new vinyl record

**Request Body:**

```json
{
  "title": "1989",
  "artist": "Taylor Swift",
  "year": 2014,
  "genre": "Pop",
  "label": "Big Machine Records",
  "description": "Fifth studio album...",
  "tracks": [
    {
      "side": "A1",
      "name": "Welcome to New York",
      "duration": "3:32"
    }
  ]
}
```

### PUT `/vinyls/:id`

Update an existing vinyl record

### DELETE `/vinyls/:id`

Delete a vinyl record

### POST `/vinyls/:id/tracks`

Add a single track to an existing vinyl record

**Request Body:**

```json
{
  "side": "A1",
  "name": "Welcome to New York",
  "duration": "3:32"
}
```

## 🎯 Usage Tips

### Adding a Vinyl Record

1. Click the **"+ Add Record"** button in the navigation or grid
2. Fill in the required fields (Title and Artist are mandatory)
3. Add tracks using the **"+ Add Track"** button
   - Select the side from dropdown (A1-A9, B1-B9)
   - Enter track name and duration (MM:SS format)
4. Click **"Add to Collection"**

### Editing a Record

1. Click on any vinyl card to view details
2. Click the **"Edit"** button in the header
3. Make your changes
4. Click **"Save Changes"**

### Searching & Filtering

- Use the **search bar** to find records by title, artist, or label
- Use the **genre dropdown** to filter by genre
- Use the **sort dropdown** to organize your collection
- Change **sort order** between ascending and descending

## 🎨 Design Features

- **Spinning vinyl animation** on card hover
- **Gradient accents** with teal and mint colors
- **Smooth transitions** throughout the interface
- **Modal overlays** for detailed views and forms
- **Custom scrollbars** matching the theme
- **Responsive grid layout** that adapts to screen size

## 🔧 Configuration

### Database

The default configuration uses SQLite with a file-based database. To change the database:

1. Update the `DATABASE_URL` in `.env`
2. Run `npm run db` to apply the schema

### Port

Change the server port by updating `PORT` in `.env` (default: 3000)

## 🐛 Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Reset the database
rm prisma/dev.db
npm run db
npm run seed
```

### Module Not Found

Ensure all dependencies are installed:

```bash
rm -rf node_modules
npm run setup
```

## 📝 Data Model

```prisma
model Vinyl {
  id          String   @id @default(cuid())
  title       String
  artist      String
  year        Int?
  label       String?
  genre       String?
  description String?
  tracks      Track[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Track {
  id       String @id @default(cuid())
  side     String  // e.g., "A1", "B2"
  name     String
  duration String  // e.g., "3:45"
  vinylId  String
  vinyl    Vinyl  @relation(fields: [vinylId], references: [id], onDelete: Cascade)
}
```

## 🎉 Acknowledgments

- Design inspired by classic vinyl records and modern dark UI trends
- Icons from Lucide (via inline SVG)
- Fonts from Google Fonts

---

**Made with ❤️ and vinyl records** 🎵

For questions or support, please open an issue on GitHub.
