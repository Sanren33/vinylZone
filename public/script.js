const API_URL = "/api/vinyls";
const COLLECTION_URL = "/api/me/collection";
const WISHLIST_URL = "/api/me/wishlist";
const MEMBERS_URL = "/api/me/members";

let currentVinyls = [];
let myCollection = [];
let myWishlist = [];
let myMembers = [];
const collectionByVinylId = new Map();
let trackCount = 0;
let currentEditId = null;
let currentVinylId = null;
let currentUser = null;
let currentProfile = null;
let isAuthenticated = false;
let activeFriendId = null;
const friendCollectionsCache = {};
const friendWishlistsCache = {};

// Check authentication status
async function checkAuth() {
  try {
    const response = await fetch("/api/user");
    if (response.ok) {
      currentUser = await response.json();
      isAuthenticated = true;
    } else {
      isAuthenticated = false;
    }
  } catch (error) {
    console.error("Auth check error:", error);
    isAuthenticated = false;
  }

  renderNav();
  renderDashboardShell();
  loadVinyls();

  if (isAuthenticated) {
    await loadProfile();
    await loadMyCollection();
    await loadWishlist();
    loadMembers();
    loadVinyls(getLibraryFilters());
  } else {
    renderLockedSections();
  }
}

function renderNav() {
  if (isAuthenticated) {
    document.getElementById("navActions").innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <span style="color: var(--vinyl-teal); font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px;">
        Welcome, ${escapeHtml(currentUser.name)}!
      </span>
      <button class="btn-add" onclick="showAddModal()">
        <span class="plus-icon">+</span>
        <span>Add Record</span>
      </button>
      <a href="/logout" class="btn-secondary" style="text-decoration: none; display: inline-block;">
        Logout
      </a>
    </div>
  `;
  } else {
    document.getElementById("navActions").innerHTML = `
      <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
        <button class="btn-add is-disabled" title="Login to unlock this feature">
          <span class="plus-icon">+</span>
          <span>Add Record</span>
        </button>
        <a href="/login" class="btn-secondary" style="text-decoration: none; display: inline-block;">
          Login
        </a>
      </div>
    `;
  }
}

// Dashboard shell with tabs
function renderDashboardShell() {
  const lockedTooltip = isAuthenticated
    ? ""
    : `<span class="tooltiptext">Login to unlock this feature</span>`;

  document.getElementById("mainContent").innerHTML = `
    <div class="dashboard-hero">
      <div class="stat-grid">
        <div class="stat-card tab-button active" data-view="library" onclick="switchTab('library')">
          <div class="stat-label">Vinyl Library</div>
          <div class="stat-value" id="vinylCount">0</div>
          <p class="helper-text">Browse all vinyls in this area.</p>
        </div>
        <div class="stat-card tab-button ${
          !isAuthenticated ? "is-disabled tooltip" : ""
        }" data-view="collection" onclick="switchTab('collection')">
          <div class="stat-label">My Collection</div>
          <div class="stat-value" id="collectionCount">0</div>
          <p class="helper-text">Track price paid, condition, and purchase history.</p>
          ${lockedTooltip}
        </div>
        <div class="stat-card tab-button ${
          !isAuthenticated ? "is-disabled tooltip" : ""
        }" data-view="wishlist" onclick="switchTab('wishlist')">
          <div class="stat-label">Wishlist</div>
          <div class="stat-value" id="wishlistCount">0</div>
          <p class="helper-text">Records you want to hunt down next.</p>
          ${lockedTooltip}
        </div>
        <div class="stat-card tab-button ${
          !isAuthenticated ? "is-disabled tooltip" : ""
        }" data-view="social" onclick="switchTab('social')">
          <div class="stat-label">Friends</div>
          <div class="stat-value" id="friendsCount">0</div>
          <p class="helper-text">See what your crew is spinning and saving.</p>
          ${lockedTooltip}
        </div>
      </div>
    </div>
    <section id="librarySection" class="tab-section active"></section>
    <section id="collectionSection" class="tab-section"></section>
    <section id="wishlistSection" class="tab-section"></section>
    <section id="socialSection" class="tab-section"></section>
    `;
}

function renderLockedSections() {
  const lockedMessage = `
    <div class="empty-state">
      <div class="empty-icon">
        <div class="vinyl-record"></div>
      </div>
      <h3>Login to unlock this feature</h3>
      <p>Sign in to manage your collection, wishlist, and friends.</p>
      <a href="/login" class="btn-primary" style="text-decoration:none;">Login</a>
    </div>
  `;

  const collectionSection = document.getElementById("collectionSection");
  const wishlistSection = document.getElementById("wishlistSection");
  const socialSection = document.getElementById("socialSection");
  if (collectionSection) collectionSection.innerHTML = lockedMessage;
  if (wishlistSection) wishlistSection.innerHTML = lockedMessage;
  if (socialSection) socialSection.innerHTML = lockedMessage;
}

function switchTab(view) {
  const targetButton = Array.from(
    document.querySelectorAll(".tab-button")
  ).find((btn) => btn.dataset.view === view);
  if (targetButton?.classList.contains("is-disabled")) return;

  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.remove("active");
  });
  const target = document.getElementById(`${view}Section`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

async function loadProfile() {
  if (!isAuthenticated) return;

  try {
    const response = await fetch("/api/me");
    if (!response.ok) return;
    currentProfile = await response.json();

    if (!myCollection.length && currentProfile.collections) {
      myCollection = currentProfile.collections;
      updateCollectionIndex(myCollection);
    }
    if (!myWishlist.length && currentProfile.wishlists) {
      myWishlist = currentProfile.wishlists;
    }

    updateStats();
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

function updateStats() {
  const shareEl = document.getElementById("shareId");
  if (shareEl)
    shareEl.textContent = isAuthenticated
      ? currentProfile?.id || "—"
      : "Login to get your ID";

  const vinylCount = document.getElementById("vinylCount");
  if (vinylCount) vinylCount.textContent = currentVinyls.length;

  const collectionCount = document.getElementById("collectionCount");
  if (collectionCount) collectionCount.textContent = myCollection.length;

  const wishlistCount = document.getElementById("wishlistCount");
  if (wishlistCount) wishlistCount.textContent = myWishlist.length;

  const friendsCount = document.getElementById("friendsCount");
  if (friendsCount) friendsCount.textContent = myMembers.length;
}

// Generate side options (A1-A9, B1-B9)
function getSideOptions() {
  const options = [];
  for (let side of ["A", "B"]) {
    for (let num = 1; num <= 9; num++) {
      options.push(`${side}${num}`);
    }
  }
  return options;
}

// Load vinyls
async function loadVinyls(filters = {}) {
  const section = document.getElementById("librarySection");
  if (!section) return;

  section.innerHTML = `
  <div class="controls-section">
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" id="searchInput" placeholder="Search your collection..." oninput="applyFilters()" />
    </div>

    <div class="filter-group">
      <select id="genreFilter" onchange="applyFilters()">
        <option value="">All Genres</option>
      </select>

      <select id="sortBy" onchange="applyFilters()">
        <option value="createdAt">Recently Added</option>
        <option value="title">Title</option>
        <option value="artist">Artist</option>
        <option value="year">Year</option>
      </select>

      <select id="sortOrder" onchange="applyFilters()">
        <option value="desc">↓ Descending</option>
        <option value="asc">↑ Ascending</option>
      </select>
    </div>
  </div>
  <div id="vinylsContainer" class="vinyl-grid">
    <div class="loading"><div class="spinner"></div><p>Loading collection...</p></div>
  </div>
`;

  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(
      queryParams.toString() ? `${API_URL}?${queryParams}` : API_URL
    );
    currentVinyls = await response.json();

    const vinylsContainer = document.getElementById("vinylsContainer");

    if (currentVinyls.length === 0) {
      vinylsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <div class="vinyl-record"></div>
        </div>
        <h3>Your collection is empty</h3>
        <p>Start building your vinyl library</p>
        <button onclick="showAddModal()" class="btn-primary">Add Your First Record</button>
      </div>
    `;
      return;
    }

    let cardsHTML = `
    <div class="vinyl-card add-card ${!isAuthenticated ? "is-disabled" : ""}" ${
      !isAuthenticated
        ? 'title="Login to unlock this feature"'
        : 'onclick="showAddModal()"'
    } >
      <div class="add-card-content">
        <div class="add-icon">+</div>
        <h3>Add Record</h3>
      </div>
    </div>
  `;

    cardsHTML += currentVinyls
      .map((vinyl) => {
        const inCollection = myCollection.some(
          (item) => item.vinylId === vinyl.id
        );
        const inWishlist = myWishlist.some((item) => item.vinylId === vinyl.id);
        const collectionFlag = inCollection
          ? '<span class="flag" title="In your collection">✔</span>'
          : "";
        const wishlistFlag = inWishlist
          ? '<span class="flag" title="In your wishlist">🎁</span>'
          : "";

        return `
      <div class="vinyl-card" onclick="viewVinyl('${vinyl.id}')">
        <div class="card-vinyl">
        <div class="card-flags">${collectionFlag}${wishlistFlag}</div>
          <div class="vinyl-record"></div>
        </div>
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(vinyl.title)}</h3>
          <p class="card-artist">${escapeHtml(vinyl.artist)}</p>
          <div class="card-meta">
            ${vinyl.year ? `<span>${vinyl.year}</span>` : ""}
            ${vinyl.genre ? `<span>${escapeHtml(vinyl.genre)}</span>` : ""}
          </div>
          <div class="card-tracks">${vinyl.tracks.length} track${
          vinyl.tracks.length !== 1 ? "s" : ""
        }</div>
        </div>
      </div>
    `;
      })
      .join("");

    vinylsContainer.innerHTML = cardsHTML;

    // Populate genre filter
    const genres = [
      ...new Set(currentVinyls.map((v) => v.genre).filter(Boolean)),
    ];
    const genreFilter = document.getElementById("genreFilter");
    const currentGenre = genreFilter?.value || "";
    if (genreFilter) {
      genreFilter.innerHTML =
        '<option value="">All Genres</option>' +
        genres
          .map(
            (g) =>
              `<option value="${escapeHtml(g)}" ${
                g === currentGenre ? "selected" : ""
              }>${escapeHtml(g)}</option>`
          )
          .join("");
    }
  } catch (error) {
    const container = document.getElementById("vinylsContainer");
    if (container) {
      container.innerHTML = `
    <div class="error-state">
      <p>Error loading collection. Please try again.</p>
      <button onclick="loadVinyls()" class="btn-secondary">Retry</button>
    </div>
  `;
    }
    console.error("Error:", error);
  }
}

// Apply filters
function applyFilters() {
  const filters = getLibraryFilters();

  Object.keys(filters).forEach((key) => !filters[key] && delete filters[key]);
  loadVinyls(filters);
}

function getLibraryFilters() {
  return {
    search: document.getElementById("searchInput")?.value,
    genre: document.getElementById("genreFilter")?.value,
    sortBy: document.getElementById("sortBy")?.value,
    order: document.getElementById("sortOrder")?.value,
  };
}

// Load current user's collection
async function loadMyCollection(filters = {}) {
  if (!isAuthenticated) {
    const section = document.getElementById("collectionSection");
    if (section) {
      section.innerHTML = `
        <div class="empty-state">
          <h3>Login to unlock this feature</h3>
          <p>Sign in to track purchases and condition.</p>
        </div>
      `;
    }
    return;
  }

  const section = document.getElementById("collectionSection");
  if (!section) return;

  section.innerHTML = `
    <div class="controls-section">
      <div class="filter-group">
        <select id="collectionConditionFilter" onchange="loadMyCollection(getCollectionFilters())">
          <option value="">All Conditions</option>
          <option value="Mint">Mint</option>
          <option value="Very Good">Very Good</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
        </select>
        <select id="collectionGenreFilter" onchange="loadMyCollection(getCollectionFilters())">
          <option value="">All Genres</option>
        </select>
        <select id="collectionSortFilter" onchange="loadMyCollection(getCollectionFilters())">
          <option value="purchasedAt">Recently Purchased</option>
          <option value="price">Price</option>
          <option value="createdAt">Date Added</option>
        </select>
        <select id="collectionOrderFilter" onchange="loadMyCollection(getCollectionFilters())">
          <option value="desc">↓ Descending</option>
          <option value="asc">↑ Ascending</option>
        </select>
      </div>
    </div>
    <div id="collectionGrid" class="vinyl-grid">
      <div class="loading"><div class="spinner"></div><p>Loading your collection...</p></div>
    </div>
  `;

  try {
    const query = new URLSearchParams(filters);
    const url = query.toString()
      ? `${COLLECTION_URL}?${query}`
      : COLLECTION_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load collection");
    myCollection = await response.json();
    updateCollectionIndex(myCollection);
    updateStats();
    renderCollectionGrid();
    const viewOpen = document
      .getElementById("viewModal")
      ?.classList.contains("active");
    if (viewOpen && currentVinylId) {
      setCollectionForm(getCollectionEntry(currentVinylId));
    }
    loadVinyls(getLibraryFilters());

    const genres = [
      ...new Set(myCollection.map((c) => c.vinyl?.genre).filter(Boolean)),
    ];
    const genreSelect = document.getElementById("collectionGenreFilter");
    const selected = genreSelect?.value || "";
    if (genreSelect) {
      genreSelect.innerHTML =
        '<option value="">All Genres</option>' +
        genres
          .map(
            (g) =>
              `<option value="${escapeHtml(g)}" ${
                g === selected ? "selected" : ""
              }>${escapeHtml(g)}</option>`
          )
          .join("");
    }
  } catch (error) {
    console.error("Collection load error:", error);
    const grid = document.getElementById("collectionGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="error-state">
          <p>Could not load your collection.</p>
          <button class="btn-secondary" onclick="loadMyCollection()">Retry</button>
        </div>
      `;
    }
  }
}

function getCollectionFilters() {
  const filters = {
    condition: document.getElementById("collectionConditionFilter")?.value,
    genre: document.getElementById("collectionGenreFilter")?.value,
    sortBy: document.getElementById("collectionSortFilter")?.value,
    order: document.getElementById("collectionOrderFilter")?.value,
  };
  Object.keys(filters).forEach((key) => !filters[key] && delete filters[key]);
  return filters;
}

function updateCollectionIndex(entries = []) {
  entries.forEach((item) => {
    if (item?.vinylId) {
      collectionByVinylId.set(item.vinylId, item);
    }
  });
}

function getCollectionEntry(vinylId) {
  if (!vinylId) return null;
  return (
    collectionByVinylId.get(vinylId) ||
    myCollection.find((item) => item.vinylId === vinylId) ||
    null
  );
}

async function fetchCollectionEntry(vinylId) {
  if (!vinylId || !isAuthenticated) return null;
  try {
    const response = await fetch(`${COLLECTION_URL}/by-vinyl/${vinylId}`);
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.vinylId) {
      collectionByVinylId.set(data.vinylId, data);
      return data;
    }
    return null;
  } catch (error) {
    console.error("fetchCollectionEntry error:", error);
    return null;
  }
}

function renderCollectionGrid() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  if (myCollection.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <div class="vinyl-record"></div>
        </div>
        <h3>No records logged yet</h3>
        <p>Add a record from the library to track purchase details.</p>
        <button onclick="switchTab('library')" class="btn-primary">Browse Library</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = myCollection
    .map(
      (item) => `
        <div class="vinyl-card" onclick="viewVinyl('${item.vinylId}')">
          <div class="card-content">
            <h3 class="card-title">${escapeHtml(item.vinyl.title)}</h3>
            <p class="card-artist">${escapeHtml(item.vinyl.artist)}</p>
            <div class="card-meta">
              ${
                item.vinyl.genre
                  ? `<span>${escapeHtml(item.vinyl.genre)}</span>`
                  : ""
              }
              ${
                item.condition
                  ? `<span>${escapeHtml(item.condition)}</span>`
                  : ""
              }
            </div>
            <div class="card-tracks">
              ${
                item.price ? formatCurrency(item.price) : "Price not set"
              } · Purchased ${
        item.purchasedAt ? formatDate(item.purchasedAt) : "—"
      }
            </div>
            ${
              item.note
                ? `<p class="helper-text" style="margin-top: 0.5rem;">${escapeHtml(
                    item.note
                  )}</p>`
                : ""
            }
            <div class="form-actions" style="margin-top: 1rem;">
              <button class="btn-danger" onclick="removeCollectionItem(event, '${
                item.id
              }')">Remove</button>
              <button class="btn-secondary" onclick="viewVinyl('${
                item.vinylId
              }')">View</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

// Load current user's wishlist
async function loadWishlist(filters = {}) {
  if (!isAuthenticated) {
    const section = document.getElementById("wishlistSection");
    if (section) {
      section.innerHTML = `
        <div class="empty-state">
          <h3>Login to unlock this feature</h3>
          <p>Save records you want to hunt down next.</p>
        </div>
      `;
    }
    return;
  }

  const section = document.getElementById("wishlistSection");
  if (!section) return;

  section.innerHTML = `
    <div class="controls-section">
      <div class="filter-group">
        <select id="wishlistGenre" onchange="loadWishlist(getWishlistFilters())">
          <option value="">All Genres</option>
        </select>
        <select id="wishlistSort" onchange="loadWishlist(getWishlistFilters())">
          <option value="addedAt">Recently Added</option>
          <option value="createdAt">Date Logged</option>
        </select>
        <select id="wishlistOrder" onchange="loadWishlist(getWishlistFilters())">
          <option value="desc">↓ Descending</option>
          <option value="asc">↑ Ascending</option>
        </select>
      </div>
    </div>
    <div id="wishlistGrid" class="vinyl-grid">
      <div class="loading"><div class="spinner"></div><p>Loading wishlist...</p></div>
    </div>
  `;

  try {
    const query = new URLSearchParams(filters);
    const url = query.toString() ? `${WISHLIST_URL}?${query}` : WISHLIST_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load wishlist");
    myWishlist = await response.json();
    updateStats();
    renderWishlistGrid();
    loadVinyls(getLibraryFilters());

    const genres = [
      ...new Set(myWishlist.map((w) => w.vinyl?.genre).filter(Boolean)),
    ];
    const genreSelect = document.getElementById("wishlistGenre");
    const selected = genreSelect?.value || "";
    if (genreSelect) {
      genreSelect.innerHTML =
        '<option value="">All Genres</option>' +
        genres
          .map(
            (g) =>
              `<option value="${escapeHtml(g)}" ${
                g === selected ? "selected" : ""
              }>${escapeHtml(g)}</option>`
          )
          .join("");
    }
  } catch (error) {
    console.error("Wishlist load error:", error);
    const grid = document.getElementById("wishlistGrid");
    if (grid) {
      grid.innerHTML = `
        <div class="error-state">
          <p>Could not load your wishlist.</p>
          <button class="btn-secondary" onclick="loadWishlist()">Retry</button>
        </div>
      `;
    }
  }
}

function getWishlistFilters() {
  const filters = {
    genre: document.getElementById("wishlistGenre")?.value,
    sortBy: document.getElementById("wishlistSort")?.value,
    order: document.getElementById("wishlistOrder")?.value,
  };
  Object.keys(filters).forEach((key) => !filters[key] && delete filters[key]);
  return filters;
}

function renderWishlistGrid() {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  if (myWishlist.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <div class="vinyl-record"></div>
        </div>
        <h3>Wishlist is empty</h3>
        <p>Save records you want to add to your crates.</p>
        <button onclick="switchTab('library')" class="btn-primary">Browse Library</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = myWishlist
    .map(
      (item) => `
        <div class="vinyl-card" onclick="viewVinyl('${item.vinylId}')">
          <div class="card-content">
            <h3 class="card-title">${escapeHtml(item.vinyl.title)}</h3>
            <p class="card-artist">${escapeHtml(item.vinyl.artist)}</p>
            <div class="card-meta">
              ${
                item.vinyl.genre
                  ? `<span>${escapeHtml(item.vinyl.genre)}</span>`
                  : ""
              }
              <span>Added ${formatDate(item.addedAt || item.createdAt)}</span>
            </div>
            <div class="form-actions" style="margin-top: 1rem;">
              <button class="btn-danger" onclick="removeWishlistItem(event, '${
                item.id
              }')">Remove</button>
              <button class="btn-secondary" onclick="viewVinyl('${
                item.vinylId
              }')">View</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

// Load social/members area
async function loadMembers() {
  if (!isAuthenticated) {
    const section = document.getElementById("socialSection");
    if (section) {
      section.innerHTML = `
        <div class="empty-state">
          <h3>Login to unlock this feature</h3>
          <p>Follow friends to browse their shelves.</p>
        </div>
      `;
    }
    return;
  }

  const section = document.getElementById("socialSection");
  if (!section) return;

  section.innerHTML = `
    <div class="controls-section">
      <div class="form-row">
        <div class="form-field">
          <label>Friend User ID</label>
          <input type="text" id="friendIdInput" placeholder="Paste a friend's user id to follow" />
        </div>
        <div class="form-field">
          <label style="visibility:hidden;">Add friend</label>
          <button class="btn-primary" type="button" onclick="addMember()">Follow Friend</button>
        </div>
      </div>
      <p class="helper-text">Share your ID (${
        currentProfile?.id || "loading..."
      }) so friends can follow you.</p>
    </div>
    <div id="membersContainer" class="vinyl-grid">
      <div class="loading"><div class="spinner"></div><p>Loading friends...</p></div>
    </div>
    <div id="friendPanels"></div>
  `;

  try {
    const response = await fetch(MEMBERS_URL);
    if (!response.ok) throw new Error("Failed to load members");
    myMembers = await response.json();
    updateStats();
    renderMembersList();
  } catch (error) {
    console.error("Members load error:", error);
    const container = document.getElementById("membersContainer");
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <p>Could not load your friends.</p>
          <button class="btn-secondary" onclick="loadMembers()">Retry</button>
        </div>
      `;
    }
  }
}

function renderMembersList() {
  const container = document.getElementById("membersContainer");
  if (!container) return;

  if (myMembers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <div class="vinyl-record"></div>
        </div>
        <h3>No friends yet</h3>
        <p>Share your ID and follow friends to see what they are spinning.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myMembers
    .map((member) => {
      const friendName = member.friend?.name || "Collector";
      const friendEmail = member.friend?.email || "No email available";
      return `
        <div class="vinyl-card">
          <div class="card-content">
            <h3 class="card-title">${escapeHtml(friendName).split("@")[0]}</h3>
            <p class="card-artist">${escapeHtml(friendEmail)}</p>
            <div class="card-meta">
              <span>ID: ${escapeHtml(member.friendId)}</span>
              <span>Since ${formatDate(member.createdAt)}</span>
            </div>
            <div class="form-actions" style="margin-top: 1rem;">
              <button class="btn-danger" onclick="removeMember(event, '${
                member.id
              }')">Unfollow</button>
              <button class="btn-secondary" onclick="viewFriendCollection('${
                member.friendId
              }');viewFriendWishlist('${member.friendId}')">View</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function addMember() {
  const input = document.getElementById("friendIdInput");
  const friendId = input?.value.trim();
  if (!friendId) {
    alert("Enter a friend ID to follow.");
    return;
  }

  try {
    const response = await fetch(MEMBERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    if (response.ok) {
      input.value = "";
      await loadMembers();
    } else {
      const error = await response.json().catch(() => ({}));
      alert(error.error || "Could not follow friend.");
    }
  } catch (error) {
    console.error("Add member error:", error);
    alert("Could not follow friend. Please try again.");
  }
}

async function removeMember(event, id) {
  event?.stopPropagation();
  if (!confirm("Remove this friend?")) return;

  try {
    const removedFriend = myMembers.find((member) => member.id === id);
    const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadMembers();
      if (removedFriend && removedFriend.friendId === activeFriendId) {
        activeFriendId = null;
        renderFriendPanels();
      }
    } else {
      alert("Could not remove friend.");
    }
  } catch (error) {
    console.error("Remove member error:", error);
  }
}

async function viewFriendCollection(friendId) {
  if (!isAuthenticated) return;
  activeFriendId = friendId;

  if (!friendCollectionsCache[friendId]) {
    const response = await fetch(`/api/members/${friendId}/collection`);
    if (response.ok) {
      friendCollectionsCache[friendId] = await response.json();
    } else {
      alert("Could not load friend's collection.");
      return;
    }
  }

  renderFriendPanels();
}

async function viewFriendWishlist(friendId) {
  if (!isAuthenticated) return;
  activeFriendId = friendId;

  if (!friendWishlistsCache[friendId]) {
    const response = await fetch(`/api/members/${friendId}/wishlist`);
    if (response.ok) {
      friendWishlistsCache[friendId] = await response.json();
    } else {
      alert("Could not load friend's wishlist.");
      return;
    }
  }

  renderFriendPanels();
}

function renderFriendPanels() {
  const container = document.getElementById("friendPanels");
  if (!container) return;

  if (!activeFriendId) {
    container.innerHTML = "";
    return;
  }

  const friend = myMembers.find((m) => m.friendId === activeFriendId);
  const collection = friendCollectionsCache[activeFriendId] || [];
  const wishlist = friendWishlistsCache[activeFriendId] || [];

  container.innerHTML = `
    <div class="dashboard-hero" style="margin-top: 1rem;">
      <div class="action-card-header">
        <div>
          <p class="stat-label">Viewing ${escapeHtml(
            friend?.friend?.name || "Friend"
          )}</p>
          <p class="helper-text">${escapeHtml(friend?.friend?.email || "")}</p>
        </div>
        <span class="pill">${collection.length} in collection · ${
    wishlist.length
  } wishlisted</span>
      </div>
      <div class="action-grid">
        <div>
          <h3 class="section-title" style="margin-bottom: 0.5rem;">Collection</h3>
          <div class="vinyl-grid">
            ${
              collection.length
                ? collection
                    .map(
                      (item) => `
                      <div class="vinyl-card" onclick="viewVinyl('${
                        item.vinyl.id
                      }')">
                        <div class="card-content">
                          <h3 class="card-title">${escapeHtml(
                            item.vinyl.title
                          )}</h3>
                          <p class="card-artist">${escapeHtml(
                            item.vinyl.artist
                          )}</p>
                          <div class="card-meta">
                            ${
                              item.vinyl.genre
                                ? `<span>${escapeHtml(item.vinyl.genre)}</span>`
                                : ""
                            }
                            ${
                              item.condition
                                ? `<span>${escapeHtml(item.condition)}</span>`
                                : ""
                            }
                          </div>
                          <div class="card-tracks">${
                            item.price ? formatCurrency(item.price) : "No price"
                          } · Purchased ${formatDate(item.purchasedAt)}</div>
                        </div>
                      </div>
                    `
                    )
                    .join("")
                : `<div class="helper-text">No items yet.</div>`
            }
          </div>
        </div>
        <div>
          <h3 class="section-title" style="margin-bottom: 0.5rem;">Wishlist</h3>
          <div class="vinyl-grid">
            ${
              wishlist.length
                ? wishlist
                    .map(
                      (item) => `
                      <div class="vinyl-card" onclick="viewVinyl('${
                        item.vinyl.id
                      }')">
                        <div class="card-content">
                          <h3 class="card-title">${escapeHtml(
                            item.vinyl.title
                          )}</h3>
                          <p class="card-artist">${escapeHtml(
                            item.vinyl.artist
                          )}</p>
                          <div class="card-meta">
                            ${
                              item.vinyl.genre
                                ? `<span>${escapeHtml(item.vinyl.genre)}</span>`
                                : ""
                            }
                            <span>Added ${formatDate(
                              item.addedAt || item.createdAt
                            )}</span>
                          </div>
                        </div>
                      </div>
                    `
                    )
                    .join("")
                : `<div class="helper-text">Wishlist is empty.</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

// View vinyl details
async function viewVinyl(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      const message = `Unable to load vinyl (status ${response.status})`;
      console.error(message);
      alert(message);
      return;
    }
    const vinyl = await response.json();

    currentEditId = vinyl.id;
    currentVinylId = vinyl.id;

    document.getElementById("viewTitle").textContent = vinyl.title;
    document.getElementById("viewArtist").textContent = vinyl.artist;
    document.getElementById("viewYear").textContent = vinyl.year || "—";
    document.getElementById("viewGenre").textContent = vinyl.genre || "—";
    document.getElementById("viewLabel").textContent = vinyl.label || "—";

    const descContainer = document.getElementById("viewDescriptionContainer");
    if (vinyl.description) {
      document.getElementById("viewDescription").textContent =
        vinyl.description;
      descContainer.style.display = "block";
    } else {
      descContainer.style.display = "none";
    }

    document.getElementById("viewTracks").innerHTML = vinyl.tracks
      .map(
        (track) => `
      <div class="track-item">
        <span class="track-side">${escapeHtml(track.side)}</span>
        <span class="track-name">${escapeHtml(track.name)}</span>
        <span class="track-duration">${escapeHtml(track.duration)}</span>
      </div>
    `
      )
      .join("");

    const cachedEntry = getCollectionEntry(vinyl.id);
    let collectionEntry = cachedEntry;
    if (isAuthenticated) {
      const fetchedEntry = await fetchCollectionEntry(vinyl.id);
      if (fetchedEntry) {
        collectionEntry = fetchedEntry;
      }
    }
    setCollectionForm(collectionEntry);
    setWishlistForm(
      myWishlist.find((item) => item.vinylId === vinyl.id) || null
    );

    const editBtn = document.querySelector(".btn-edit");
    if (editBtn)
      editBtn.style.display = isAuthenticated ? "inline-flex" : "none";
    const deleteBtn = document.getElementById("deleteRecordBtn");
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
    updateDeleteAccess();

    document.getElementById("viewModal").classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error:", error);
    alert("Error loading vinyl details");
  }
}

function setCollectionForm(entry, options = {}) {
  const { preserveOpen = false } = options;
  const effectiveEntry =
    entry || (currentVinylId ? getCollectionEntry(currentVinylId) : null);
  const priceEl = document.getElementById("collectionPrice");
  const saveBtn = document.getElementById("collectionSaveBtn");
  const removeBtn = document.getElementById("collectionRemoveBtn");
  const stateLabel = document.getElementById("collectionStateLabel");
  const stateBadge = document.getElementById("collectionStateBadge");
  const meta = document.getElementById("collectionMeta");
  if (
    !priceEl ||
    !saveBtn ||
    !removeBtn ||
    !stateLabel ||
    !stateBadge ||
    !meta
  ) {
    console.warn(
      "Collection form elements missing; skipping setCollectionForm"
    );
    return;
  }

  if (!preserveOpen) {
    collapseSection("collectionFormBody", Boolean(effectiveEntry));
  }

  priceEl.value = effectiveEntry?.price ?? "";
  const conditionEl = document.getElementById("collectionCondition");
  const dateEl = document.getElementById("collectionDate");
  const noteEl = document.getElementById("collectionNote");
  if (conditionEl) conditionEl.value = effectiveEntry?.condition ?? "";
  if (dateEl)
    dateEl.value = effectiveEntry?.purchasedAt
      ? formatDateInput(effectiveEntry.purchasedAt)
      : formatDateInput(new Date());
  if (noteEl) noteEl.value = effectiveEntry?.note ?? "";

  saveBtn.textContent = effectiveEntry ? "Update" : "Add to My Collection";
  removeBtn.style.display = effectiveEntry ? "inline-flex" : "none";
  stateLabel.textContent = effectiveEntry
    ? "Already in your collection"
    : "Not in your crates yet";
  stateBadge.textContent = effectiveEntry ? "Tracked" : "New";
  meta.textContent = effectiveEntry
    ? `Purchased ${formatDate(effectiveEntry.purchasedAt)}${
        effectiveEntry.price ? ` · ${formatCurrency(effectiveEntry.price)}` : ""
      }`
    : "Log what you paid, the condition, and when you picked it up.";

  const toggleLabel = document.getElementById("collectionToggleLabel");
  if (toggleLabel) {
    toggleLabel.textContent = effectiveEntry
      ? "Edit Collection Entry"
      : "Add to Collection";
  }

  updateCollectionAccess();
  const inCollection = Boolean(effectiveEntry);
  const inWishlist = !!myWishlist.find(
    (item) => item.vinylId === currentVinylId
  );
  setWishlistState(inCollection, inWishlist);
  syncCollectionToggleState();
}

function setWishlistForm(entry) {
  const inCollection = !!myCollection.find(
    (item) => item.vinylId === currentVinylId
  );
  const inWishlist = !!entry;
  setWishlistState(inCollection, inWishlist);
}

function toggleCollectionForm() {
  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }
  const existing = getCollectionEntry(currentVinylId);
  if (existing) {
    setCollectionForm(existing, { preserveOpen: true });
  }
  toggleSection("collectionFormBody");
  syncCollectionToggleState();
}

function toggleSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isActive = el.classList.contains("active");
  el.classList.toggle("active", !isActive);
}

function collapseSection(id, show = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("active", show);
  if (id === "collectionFormBody") {
    syncCollectionToggleState();
  }
}

function updateCollectionAccess() {
  const toggleBtn = document.getElementById("collectionToggleBtn");
  const accordion = document.getElementById("collectionAccordion");
  const inputs = [
    "collectionPrice",
    "collectionCondition",
    "collectionDate",
    "collectionNote",
    "collectionSaveBtn",
    "collectionRemoveBtn",
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const locked = !isAuthenticated;
  if (toggleBtn) {
    toggleBtn.classList.toggle("is-disabled", locked);
    toggleBtn.disabled = locked;
    toggleBtn.title = locked ? "Login to unlock this feature" : "";
  }
  inputs.forEach((el) => {
    el.disabled = locked;
    if (locked) {
      el.classList.add("is-disabled");
      el.title = "Login to unlock this feature";
    } else {
      el.classList.remove("is-disabled");
      el.removeAttribute("title");
    }
  });
  if (accordion) {
    accordion.classList.toggle("is-disabled", locked);
  }
  if (locked) {
    collapseSection("collectionFormBody", false);
  }
}

function syncCollectionToggleState() {
  const body = document.getElementById("collectionFormBody");
  const toggleBtn = document.getElementById("collectionToggleBtn");
  const expanded = body?.classList.contains("active");
  if (toggleBtn) {
    toggleBtn.classList.toggle("open", Boolean(expanded));
    toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
}

function updateDeleteAccess() {
  const deleteBtn = document.getElementById("deleteRecordBtn");
  const tooltip = document.getElementById("deleteRecordTooltip");
  if (!deleteBtn || !tooltip) return;

  const locked = !isAuthenticated;
  deleteBtn.disabled = locked;
  deleteBtn.classList.toggle("is-disabled", locked);
  tooltip.textContent = locked ? "Login to unlock" : "";
  tooltip.style.display = locked ? "inline-block" : "none";
}

function setWishlistState(inCollection, inWishlist) {
  const btn = document.getElementById("wishlistToggleBtn");
  const text = document.getElementById("wishlistToggleText");
  if (!btn) return;

  const locked = !isAuthenticated || inCollection;
  btn.classList.toggle("is-disabled", locked);
  btn.disabled = locked;

  if (inCollection) {
    text.innerText = "Already in your collection";
  } else if (!isAuthenticated) {
    text.innerText = "Login to unlock this feature";
  } else if (inWishlist) {
    text.innerText = "Remove from wishlist";
  } else {
    text.innerText = "Add to wishlist";
  }

  btn.style.backgroundColor = inWishlist ? "var(--terracotta)" : "none";
}

async function toggleWishlist() {
  if (!currentVinylId) return;

  const inCollection = !!myCollection.find(
    (item) => item.vinylId === currentVinylId
  );

  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }

  if (inCollection) {
    setWishlistState(true, false);
    return;
  }

  const existing = myWishlist.find((item) => item.vinylId === currentVinylId);

  try {
    const response = await fetch(
      existing ? `/api/wishlist/${existing.id}` : WISHLIST_URL,
      {
        method: existing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: existing ? null : JSON.stringify({ vinylId: currentVinylId }),
      }
    );

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "/login";
      return;
    }

    if (response.ok) {
      await loadWishlist(getWishlistFilters());
      const refreshed = myWishlist.find(
        (item) => item.vinylId === currentVinylId
      );
      setWishlistState(false, !!refreshed);
      if (!existing) {
        switchTab("collection");
      }
    } else {
      alert("Could not update wishlist.");
    }
  } catch (error) {
    console.error("Wishlist toggle error:", error);
  }
}

function closeViewModal() {
  document.getElementById("viewModal").classList.remove("active");
  document.body.style.overflow = "";
  currentEditId = null;
  currentVinylId = null;
}

function showAddModal() {
  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }

  document.getElementById("formTitle").textContent = "Add New Record";
  document.getElementById("submitText").textContent = "Add to Collection";
  document.getElementById("vinylForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("tracksContainer").innerHTML = "";
  trackCount = 0;
  document.getElementById("addModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddModal() {
  document.getElementById("addModal").classList.remove("active");
  document.body.style.overflow = "";
}

async function editFromView() {
  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }

  const id = currentEditId;
  closeViewModal();

  try {
    const response = await fetch(`${API_URL}/${id}`);
    const vinyl = await response.json();

    document.getElementById("formTitle").textContent = "Edit Record";
    document.getElementById("submitText").textContent = "Save Changes";
    document.getElementById("editId").value = vinyl.id;

    const form = document.getElementById("vinylForm");
    form.title.value = vinyl.title;
    form.artist.value = vinyl.artist;
    form.year.value = vinyl.year || "";
    form.genre.value = vinyl.genre || "";
    form.label.value = vinyl.label || "";
    form.description.value = vinyl.description || "";

    document.getElementById("tracksContainer").innerHTML = "";
    trackCount = 0;
    vinyl.tracks.forEach((track) => {
      addTrackInput(track);
    });

    document.getElementById("addModal").classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error:", error);
    alert("Error loading vinyl for editing");
  }
}

function addTrackInput(track = null) {
  trackCount++;
  const container = document.getElementById("tracksContainer");
  const trackDiv = document.createElement("div");
  trackDiv.className = "track-input-group";

  const sideOptions = getSideOptions();
  const sideOptionsHtml = sideOptions
    .map(
      (opt) =>
        `<option value="${opt}" ${
          track && track.side === opt ? "selected" : ""
        }>${opt}</option>`
    )
    .join("");

  trackDiv.innerHTML = `
  <div class="track-input">
    <div class="track-field">
      <label>Side</label>
      <select name="track_side_${trackCount}" required>
        <option value="">Select</option>
        ${sideOptionsHtml}
      </select>
    </div>
    <div class="track-field">
      <label>Track Name</label>
      <input type="text" placeholder="e.g., We are the world" name="track_name_${trackCount}" 
              value="${track ? escapeHtml(track.name) : ""}" required />
    </div>
    <div class="track-field">
      <label>Duration</label>
      <input type="text" placeholder="MM:SS" name="track_duration_${trackCount}" 
              value="${
                track ? escapeHtml(track.duration) : ""
              }" pattern="\\d{1,2}:\\d{2}" required />
    </div>
    <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-icon btn-remove" title="Remove track">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 6L6 18M6 6l12 12"></path>
      </svg>
    </button>
  </div>
`;
  container.appendChild(trackDiv);
}

document.getElementById("vinylForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isAuthenticated) {
    alert("You must be logged in to perform this action");
    return;
  }

  const formData = new FormData(e.target);
  const editId = document.getElementById("editId").value;

  const data = {
    title: formData.get("title"),
    artist: formData.get("artist"),
    year: formData.get("year") ? parseInt(formData.get("year")) : null,
    label: formData.get("label") || null,
    genre: formData.get("genre") || null,
    description: formData.get("description") || null,
    tracks: [],
  };

  for (let i = 1; i <= trackCount; i++) {
    const name = formData.get(`track_name_${i}`);
    if (name) {
      data.tracks.push({
        side: formData.get(`track_side_${i}`),
        name,
        duration: formData.get(`track_duration_${i}`),
      });
    }
  }

  try {
    const url = editId ? `${API_URL}/${editId}` : API_URL;
    const method = editId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    if (response.ok) {
      closeAddModal();
      loadVinyls();
    } else {
      const error = await response.json();
      alert(error.message || "Error saving vinyl");
    }
  } catch (error) {
    alert("Error saving vinyl. Please try again.");
    console.error("Error:", error);
  }
});

async function deleteFromView() {
  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }
  if (!confirm("Are you sure you want to delete this record?")) return;

  try {
    const response = await fetch(`${API_URL}/${currentEditId}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      return;
    }

    if (response.ok) {
      collectionByVinylId.delete(currentEditId);
      closeViewModal();
      loadVinyls();
    } else {
      alert("Error deleting vinyl");
    }
  } catch (error) {
    alert("Error deleting vinyl. Please try again.");
    console.error("Error:", error);
  }
}

async function removeCollectionItem(event, id) {
  event?.stopPropagation();
  if (!isAuthenticated) {
    alert("Login to unlock this feature");
    return;
  }
  if (!confirm("Remove this record from your collection?")) return;
  try {
    const response = await fetch(`/api/collection/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadMyCollection(getCollectionFilters());
      const entry = [...collectionByVinylId.values()].find(
        (item) => item.id === id
      );
      if (entry?.vinylId) {
        collectionByVinylId.delete(entry.vinylId);
      }
    } else {
      alert("Could not remove record from collection.");
    }
  } catch (error) {
    console.error("Error removing collection item:", error);
  }
}

async function saveToCollection() {
  if (!isAuthenticated) {
    alert("You must be logged in to perform this action");
    window.location.href = "/login";
    return;
  }

  if (!currentVinylId) {
    alert("Select a record first.");
    return;
  }

  const existing = getCollectionEntry(currentVinylId);
  const priceValue = document.getElementById("collectionPrice").value;
  const data = {
    vinylId: currentVinylId,
    price: priceValue ? parseFloat(priceValue) : null,
    condition: document.getElementById("collectionCondition").value || null,
    note: document.getElementById("collectionNote").value || null,
    purchasedAt:
      document.getElementById("collectionDate").value ||
      formatDateInput(new Date()),
  };

  try {
    const response = await fetch(
      existing ? `/api/collection/${existing.id}` : COLLECTION_URL,
      {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          existing
            ? {
                price: data.price,
                condition: data.condition,
                note: data.note,
                purchasedAt: data.purchasedAt,
              }
            : data
        ),
      }
    );

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "/login";
      return;
    }

    if (response.ok) {
      const saved = await response.json().catch(() => null);
      if (saved?.vinylId) {
        collectionByVinylId.set(saved.vinylId, saved);
      }
      await loadMyCollection(getCollectionFilters());
      const wishlistEntry = myWishlist.find(
        (item) => item.vinylId === currentVinylId
      );
      if (wishlistEntry) {
        await fetch(`/api/wishlist/${wishlistEntry.id}`, { method: "DELETE" });
        await loadWishlist(getWishlistFilters());
      }
      setCollectionForm(getCollectionEntry(currentVinylId));
    } else {
      const error = await response.json().catch(() => ({}));
      alert(error.message || "Error saving collection entry");
    }
  } catch (error) {
    alert("Error saving collection entry. Please try again.");
    console.error("Error:", error);
  }
}

async function removeFromCollection() {
  const existing = getCollectionEntry(currentVinylId);
  if (!existing) {
    alert("This record is not in your collection.");
    return;
  }
  if (!confirm("Remove this record from your collection?")) return;

  try {
    const response = await fetch(`/api/collection/${existing.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadMyCollection(getCollectionFilters());
      collectionByVinylId.delete(existing.vinylId);
      setCollectionForm(null);
    } else {
      alert("Error removing from collection");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function removeWishlistItem(event, id) {
  event?.stopPropagation();
  if (!confirm("Remove this record from your wishlist?")) return;
  try {
    const response = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadWishlist(getWishlistFilters());
    } else {
      alert("Could not remove record from wishlist.");
    }
  } catch (error) {
    console.error("Error removing wishlist item:", error);
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(value) {
  if (value == null || value === "") return "Not set";
  const number = Number(value);
  if (Number.isNaN(number)) return "Not set";
  return `$${number.toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatDateInput(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initialize
checkAuth();

// Expose functions used by inline handlers
window.viewVinyl = viewVinyl;
window.toggleWishlist = toggleWishlist;
window.toggleCollectionForm = toggleCollectionForm;
window.showAddModal = showAddModal;
window.closeAddModal = closeAddModal;
window.closeViewModal = closeViewModal;
window.editFromView = editFromView;
window.deleteFromView = deleteFromView;
window.addTrackInput = addTrackInput;
window.removeCollectionItem = removeCollectionItem;
window.removeWishlistItem = removeWishlistItem;
