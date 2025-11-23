import prisma from '../utils/prisma.js';

const sampleVinyls = [
  {
    title: "Dark Side of the Moon",
    artist: "Pink Floyd",
    year: 1973,
    label: "Harvest Records",
    genre: "Progressive Rock",
    description: "One of the best-selling and most critically acclaimed albums of all time",
    tracks: [
      { name: "Speak to Me", duration: "1:13", side: "A1" },
      { name: "Breathe", duration: "2:43", side: "A2" },
      { name: "On the Run", duration: "3:36", side: "A3" },
      { name: "Time", duration: "6:53", side: "A4" },
      { name: "The Great Gig in the Sky", duration: "4:36", side: "A5" },
      { name: "Money", duration: "6:23", side: "B1" },
      { name: "Us and Them", duration: "7:49", side: "B2" },
      { name: "Any Colour You Like", duration: "3:26", side: "B3" },
      { name: "Brain Damage", duration: "3:49", side: "B4" },
      { name: "Eclipse", duration: "2:03", side: "B5" }
    ]
  },
  {
    title: "Abbey Road",
    artist: "The Beatles",
    year: 1969,
    label: "Apple Records",
    genre: "Rock",
    description: "The eleventh studio album by the Beatles",
    tracks: [
      { name: "Come Together", duration: "4:20", side: "A1" },
      { name: "Something", duration: "3:03", side: "A2" },
      { name: "Maxwell's Silver Hammer", duration: "3:27", side: "A3" },
      { name: "Oh! Darling", duration: "3:26", side: "A4" },
      { name: "Octopus's Garden", duration: "2:51", side: "A5" },
      { name: "I Want You (She's So Heavy)", duration: "7:47", side: "A6" },
      { name: "Here Comes the Sun", duration: "3:05", side: "B1" },
      { name: "Because", duration: "2:45", side: "B2" },
      { name: "You Never Give Me Your Money", duration: "4:02", side: "B3" },
      { name: "Sun King", duration: "2:26", side: "B4" },
      { name: "Mean Mr. Mustard", duration: "1:06", side: "B5" },
      { name: "Polythene Pam", duration: "1:12", side: "B6" },
      { name: "She Came in Through the Bathroom Window", duration: "1:57", side: "B7" },
      { name: "Golden Slumbers", duration: "1:31", side: "B8" },
      { name: "Carry That Weight", duration: "1:36", side: "B9" },
      { name: "The End", duration: "2:19", side: "B10" }
    ]
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    year: 1982,
    label: "Epic Records",
    genre: "Pop",
    description: "Best-selling album of all time",
    tracks: [
      { name: "Wanna Be Startin' Somethin'", duration: "6:03", side: "A1" },
      { name: "Baby Be Mine", duration: "4:20", side: "A2" },
      { name: "The Girl Is Mine", duration: "3:42", side: "A3" },
      { name: "Thriller", duration: "5:57", side: "A4" },
      { name: "Beat It", duration: "4:18", side: "B1" },
      { name: "Billie Jean", duration: "4:54", side: "B2" },
      { name: "Human Nature", duration: "4:06", side: "B3" },
      { name: "P.Y.T. (Pretty Young Thing)", duration: "3:59", side: "B4" },
      { name: "The Lady in My Life", duration: "5:00", side: "B5" }
    ]
  },
  {
    title: "Rumours",
    artist: "Fleetwood Mac",
    year: 1977,
    label: "Warner Bros. Records",
    genre: "Rock",
    description: "One of the best-selling albums in history",
    tracks: [
      { name: "Second Hand News", duration: "2:43", side: "A1" },
      { name: "Dreams", duration: "4:14", side: "A2" },
      { name: "Never Going Back Again", duration: "2:02", side: "A3" },
      { name: "Don't Stop", duration: "3:11", side: "A4" },
      { name: "Go Your Own Way", duration: "3:38", side: "A5" },
      { name: "Songbird", duration: "3:20", side: "A6" },
      { name: "The Chain", duration: "4:28", side: "B1" },
      { name: "You Make Loving Fun", duration: "3:31", side: "B2" },
      { name: "I Don't Want to Know", duration: "3:11", side: "B3" },
      { name: "Oh Daddy", duration: "3:54", side: "B4" },
      { name: "Gold Dust Woman", duration: "4:51", side: "B5" }
    ]
  },
  {
    title: "Kind of Blue",
    artist: "Miles Davis",
    year: 1959,
    label: "Columbia Records",
    genre: "Jazz",
    description: "Regarded as one of the greatest jazz albums ever",
    tracks: [
      { name: "So What", duration: "9:02", side: "A1" },
      { name: "Freddie Freeloader", duration: "9:33", side: "A2" },
      { name: "Blue in Green", duration: "5:27", side: "B1" },
      { name: "All Blues", duration: "11:33", side: "B2" },
      { name: "Flamenco Sketches", duration: "9:26", side: "B3" }
    ]
  },
  {
    title: "The Velvet Underground & Nico",
    artist: "The Velvet Underground",
    year: 1967,
    label: "Verve Records",
    genre: "Rock",
    description: "Influential debut album with iconic banana cover by Andy Warhol",
    tracks: [
      { name: "Sunday Morning", duration: "2:55", side: "A1" },
      { name: "I'm Waiting for the Man", duration: "4:38", side: "A2" },
      { name: "Femme Fatale", duration: "2:37", side: "A3" },
      { name: "Venus in Furs", duration: "5:08", side: "A4" },
      { name: "Run Run Run", duration: "4:20", side: "A5" },
      { name: "All Tomorrow's Parties", duration: "5:56", side: "A6" },
      { name: "Heroin", duration: "7:10", side: "B1" },
      { name: "There She Goes Again", duration: "2:38", side: "B2" },
      { name: "I'll Be Your Mirror", duration: "2:08", side: "B3" },
      { name: "The Black Angel's Death Song", duration: "3:11", side: "B4" },
      { name: "European Son", duration: "7:43", side: "B5" }
    ]
  },
  {
    title: "Back in Black",
    artist: "AC/DC",
    year: 1980,
    label: "Atlantic Records",
    genre: "Hard Rock",
    description: "One of the best-selling albums of all time",
    tracks: [
      { name: "Hells Bells", duration: "5:12", side: "A1" },
      { name: "Shoot to Thrill", duration: "5:17", side: "A2" },
      { name: "What Do You Do for Money Honey", duration: "3:35", side: "A3" },
      { name: "Given the Dog a Bone", duration: "3:31", side: "A4" },
      { name: "Let Me Put My Love Into You", duration: "4:15", side: "A5" },
      { name: "Back in Black", duration: "4:15", side: "B1" },
      { name: "You Shook Me All Night Long", duration: "3:30", side: "B2" },
      { name: "Have a Drink on Me", duration: "3:58", side: "B3" },
      { name: "Shake a Leg", duration: "4:05", side: "B4" },
      { name: "Rock and Roll Ain't Noise Pollution", duration: "4:15", side: "B5" }
    ]
  },
  {
    title: "OK Computer",
    artist: "Radiohead",
    year: 1997,
    label: "Parlophone",
    genre: "Alternative Rock",
    description: "Groundbreaking album that defined 90s alternative rock",
    tracks: [
      { name: "Airbag", duration: "4:44", side: "A1" },
      { name: "Paranoid Android", duration: "6:23", side: "A2" },
      { name: "Subterranean Homesick Alien", duration: "4:27", side: "A3" },
      { name: "Exit Music (For a Film)", duration: "4:24", side: "A4" },
      { name: "Let Down", duration: "4:59", side: "B1" },
      { name: "Karma Police", duration: "4:21", side: "B2" },
      { name: "Fitter Happier", duration: "1:57", side: "B3" },
      { name: "Electioneering", duration: "3:50", side: "B4" },
      { name: "Climbing Up the Walls", duration: "4:45", side: "B5" },
      { name: "No Surprises", duration: "3:48", side: "B6" },
      { name: "Lucky", duration: "4:19", side: "B7" },
      { name: "The Tourist", duration: "5:24", side: "B8" }
    ]
  },
  {
    title: "Blue",
    artist: "Joni Mitchell",
    year: 1971,
    label: "Reprise Records",
    genre: "Folk",
    description: "One of the greatest albums of all time",
    tracks: [
      { name: "All I Want", duration: "3:32", side: "A1" },
      { name: "My Old Man", duration: "3:33", side: "A2" },
      { name: "Little Green", duration: "3:25", side: "A3" },
      { name: "Carey", duration: "3:00", side: "A4" },
      { name: "Blue", duration: "3:00", side: "A5" },
      { name: "California", duration: "3:48", side: "B1" },
      { name: "This Flight Tonight", duration: "2:50", side: "B2" },
      { name: "River", duration: "4:00", side: "B3" },
      { name: "A Case of You", duration: "4:20", side: "B4" },
      { name: "The Last Time I Saw Richard", duration: "4:13", side: "B5" }
    ]
  },
  {
    title: "What's Going On",
    artist: "Marvin Gaye",
    year: 1971,
    label: "Tamla Records",
    genre: "Soul",
    description: "Socially conscious masterpiece",
    tracks: [
      { name: "What's Going On", duration: "3:53", side: "A1" },
      { name: "What's Happening Brother", duration: "2:56", side: "A2" },
      { name: "Flyin' High (In the Friendly Sky)", duration: "3:49", side: "A3" },
      { name: "Save the Children", duration: "4:03", side: "A4" },
      { name: "God Is Love", duration: "1:45", side: "A5" },
      { name: "Mercy Mercy Me (The Ecology)", duration: "3:15", side: "B1" },
      { name: "Right On", duration: "7:33", side: "B2" },
      { name: "Wholy Holy", duration: "3:08", side: "B3" },
      { name: "Inner City Blues (Make Me Wanna Holler)", duration: "5:28", side: "B4" }
    ]
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    // console.log('Clearing existing data...');
    // await prisma.track.deleteMany();
    // await prisma.vinyl.deleteMany();

    // Create vinyls with tracks
    console.log('Creating sample vinyls...');
    for (const vinylData of sampleVinyls) {
      const { tracks, ...vinyl } = vinylData;
      await prisma.vinyl.create({
        data: {
          ...vinyl,
          tracks: {
            create: tracks
          }
        }
      });
      console.log(`✅ Created: ${vinyl.title} by ${vinyl.artist}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📀 Created ${sampleVinyls.length} vinyls with their tracks`);

    // Display some stats
    const totalTracks = sampleVinyls.reduce((sum, vinyl) => sum + vinyl.tracks.length, 0);
    console.log(`🎵 Total tracks: ${totalTracks}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
