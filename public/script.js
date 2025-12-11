const API_URL = "/api/vinyls";
let currentVinyls = [];
let trackCount = 0;
let currentEditId = null;
let currentUser = null;
let isAuthenticated = false;

// Check authentication status
async function checkAuth() {
  try {
    const response = await fetch("/api/user");
    if (response.ok) {
      currentUser = await response.json();
      isAuthenticated = true;
      renderAuthenticatedUI();
    } else {
      // Not authenticated
      isAuthenticated = false;
      renderUnauthenticatedUI();
    }
  } catch (error) {
    console.error("Auth check error:", error);
    isAuthenticated = false;
    renderUnauthenticatedUI();
  }
}

// Render UI for authenticated users
function renderAuthenticatedUI() {
  document.getElementById("navActions").innerHTML = `
  <div style="display: flex; align-items: center; gap: 1rem;">
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
  loadVinyls();
}

// Render UI for unauthenticated users
function renderUnauthenticatedUI() {
  document.getElementById("navActions").innerHTML = `
  <a href="/login" class="btn-add" style="text-decoration: none;">
    <span>Login to Manage Collection</span>
  </a>
`;

  document.getElementById("mainContent").innerHTML = `
  <div class="welcome-state">
    <div class="empty-icon">
      <div class="vinyl-record" style="width: 200px; height: 200px;"></div>
    </div>
    <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 3rem; letter-spacing: 2px; margin-bottom: 1rem; color: var(--vinyl-cream);">
      Welcome to Vinyl Zone
    </h2>
    <p style="font-size: 1.2rem; color: rgba(245, 243, 239, 0.7); margin-bottom: 2rem; max-width: 600px;">
      Your personal vinyl collection manager. Track your records, create wishlists, and connect with fellow collectors.
    </p>
    <a href="/login" class="btn-primary" style="text-decoration: none; display: inline-block;">
      <span>Login to Get Started</span>
    </a>
  </div>
`;
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
  if (!isAuthenticated) return;

  const container = document.getElementById("mainContent");
  container.innerHTML = `
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
    const response = await fetch(`${API_URL}?${queryParams}`);
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
    <div class="vinyl-card add-card" onclick="showAddModal()">
      <div class="add-card-content">
        <div class="add-icon">+</div>
        <h3>Add Record</h3>
      </div>
    </div>
  `;

    cardsHTML += currentVinyls
      .map(
        (vinyl) => `
      <div class="vinyl-card" onclick="viewVinyl('${vinyl.id}')">
        <div class="card-vinyl">
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
    `
      )
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
    document.getElementById("vinylsContainer").innerHTML = `
    <div class="error-state">
      <p>Error loading collection. Please try again.</p>
      <button onclick="loadVinyls()" class="btn-secondary">Retry</button>
    </div>
  `;
    console.error("Error:", error);
  }
}

// Apply filters
function applyFilters() {
  const filters = {
    search: document.getElementById("searchInput")?.value,
    genre: document.getElementById("genreFilter")?.value,
    sortBy: document.getElementById("sortBy")?.value,
    order: document.getElementById("sortOrder")?.value,
  };

  Object.keys(filters).forEach((key) => !filters[key] && delete filters[key]);
  loadVinyls(filters);
}

// View vinyl details
async function viewVinyl(id) {
  if (!isAuthenticated) {
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`);
    const vinyl = await response.json();

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

    currentEditId = vinyl.id;
    document.getElementById("viewModal").classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error:", error);
    alert("Error loading vinyl details");
  }
}

function closeViewModal() {
  document.getElementById("viewModal").classList.remove("active");
  document.body.style.overflow = "";
  currentEditId = null;
}

// Show add modal
function showAddModal() {
  if (!isAuthenticated) {
    window.location.href = "/login";
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

// Edit from view modal
async function editFromView() {
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

    // Load tracks
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

// Add track input
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

// Form submission
document.getElementById("vinylForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!isAuthenticated) {
    alert("You must be logged in to perform this action");
    window.location.href = "/login";
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

  // Collect tracks
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
      window.location.href = "/login";
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

// Delete from view
async function deleteFromView() {
  if (!confirm("Are you sure you want to delete this record?")) return;

  if (!isAuthenticated) {
    alert("You must be logged in to perform this action");
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${currentEditId}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      alert("Your session has expired. Please log in again.");
      window.location.href = "/login";
      return;
    }

    if (response.ok) {
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

// Utility function
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
checkAuth();
