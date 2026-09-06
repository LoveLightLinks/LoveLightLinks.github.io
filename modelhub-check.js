const sheetURL = "https://docs.google.com/spreadsheets/d/1CAkjWcpnt3Inb887WthMt6Y6M02Lbe-1Kz1w2l_t14Q/gviz/tq?sheet=Models&tqx=responseHandler:modelHubCallback";

let models = [];
let visibleModels = [];
let pageIndex = 0;

const firstLoadCount = 10;
const nextLoadCount = 6;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let mediaManifest = {};

function getModelImages(model) {
    const files = mediaManifest[model.ID] || [];
    const folder = "images/models/" + encodeURIComponent(model.ID) + "/";
    return files.map(file => folder + encodeURIComponent(file));
}

function loadPage() {
    const grid = document.getElementById("modelGrid");

    if (pageIndex === 0) {
        grid.innerHTML = "";
    }

    const count = pageIndex === 0 ? firstLoadCount : nextLoadCount;
    const start = pageIndex === 0 ? 0 : firstLoadCount + (pageIndex - 1) * nextLoadCount;
    const end = start + count;

    visibleModels.slice(start, end).forEach(model => {
        const images = getModelImages(model);

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <img src="${images[0]}" loading="lazy"
                 onerror="this.style.display='none'">
            <h3>${model.Nickname || model.ID || "Model"}</h3>
        `;

        card.onclick = () => loadProfile(model);
        grid.appendChild(card);
    });

    if (end >= visibleModels.length) {
        document.getElementById("loadMoreBtn").textContent = "Show More";
    } else {
        document.getElementById("loadMoreBtn").textContent = "Load More";
    }
}

function loadMore() {
    pageIndex++;
    loadPage();
}

function loadProfile(model) {
    const profile = document.getElementById("profileSection");
    const media = getModelImages(model);

    const imageFiles = media.filter(file =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
    );

    const videoFiles = media.filter(file =>
        /\.(mp4|webm|ogg|mov)$/i.test(file)
    );

    const links = [];

    if (model.Instagram) links.push(`<a href="${model.Instagram}" target="_blank" rel="noopener">Instagram</a>`);
    if (model.X) links.push(`<a href="${model.X}" target="_blank" rel="noopener">X</a>`);
    if (model.Stripchat) links.push(`<a href="${model.Stripchat}" target="_blank" rel="noopener">Stripchat</a>`);
    if (model.OnlyFans) links.push(`<a href="${model.OnlyFans}" target="_blank" rel="noopener">OnlyFans</a>`);
    if (model.Other) links.push(`<a href="${model.Other}" target="_blank" rel="noopener">Other</a>`);

    const tags = model.Tags
        ? model.Tags.split(",").map(tag => {
            const cleanTag = tag.trim();
            return `<button class="tag" onclick="filterByTag('${cleanTag.replace(/'/g, "\\'")}')">${cleanTag}</button>`;
          }).join("")
        : "";

    let profileImageIndex = 0;

    function showProfileImage(index) {
        const images = profile.querySelectorAll(".profile-image");

        if (!images.length) return;

        profileImageIndex = (index + images.length) % images.length;

        images.forEach((img, i) => {
            img.style.display = i === profileImageIndex ? "block" : "none";
        });

        const counter = profile.querySelector(".gallery-counter");
        if (counter) {
            counter.textContent = `${profileImageIndex + 1} / ${images.length}`;
        }
    }

    const galleryHTML = imageFiles.length
        ? '<div class="profile-gallery">' +
          '<div class="slider">' +
          imageFiles.map((img, index) =>
              '<img src="' + img + '"' +
              ' class="profile-image"' +
              ' style="display:' + (index === 0 ? 'block' : 'none') + '"' +
              ' onerror="this.remove()">' 
          ).join("") +
          (imageFiles.length > 1
              ? '<button class="nav-btn left" onclick="changeProfileImage(-1)">‹</button>' +
                '<button class="nav-btn right" onclick="changeProfileImage(1)">›</button>' +
                '<div class="gallery-counter">1 / ' + imageFiles.length + '</div>'
              : '') +
          '</div></div>'
        : "";

    const details = model.Details
        ? model.Details
            .split(/(?=Name:|Type:|Location:|Age:|Ethnicity:|Languages:|Appearance:|Vibe:|Bio:)/)
            .map(line => line.trim())
            .filter(line => line)
            .map(line => '<div class="detail-line">' + line + '</div>')
            .join("")
        : "";

    const videosHTML = videoFiles.length
        ? '<div class="profile-videos"><h4>Videos</h4>' +
          videoFiles.map(video =>
              '<video class="profile-video" controls preload="metadata" playsinline>' +
              '<source src="' + video + '">' +
              'Your browser does not support video playback.' +
              '</video>'
          ).join("") +
          '</div>'
        : "";

    profile.innerHTML =
        '<div class="profile-card">' +
            galleryHTML +
            '<h3>' + (model.Nickname || model.ID || "Model") + '</h3>' +
            '<p><strong>ID:</strong> ' + (model.ID || "—") + '</p>' +
            (details ? '<div class="profile-details">' + details + '</div>' : '') +
            (tags ? '<div class="tags">' + tags + '</div>' : '') +
            videosHTML +
            (links.length
                ? '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:20px;">' +
                  links.join("") +
                  '</div>'
                : '') +
        '</div>';

    window.changeProfileImage = function(direction) {
        showProfileImage(profileImageIndex + direction);
    };

    history.pushState({ modelProfile: true }, "", "#model-" + encodeURIComponent(model.ID));

    window.scrollTo({
        top: profile.offsetTop - 20,
        behavior: "smooth"
    });
}

function closeProfile() {
    document.getElementById("profileSection").innerHTML = "";

    window.scrollTo({
        top: document.getElementById("modelGrid").offsetTop - 20,
        behavior: "smooth"
    });
}

window.addEventListener("popstate", function() {
    const profile = document.getElementById("profileSection");

    if (profile.innerHTML.trim()) {
        closeProfile();
    }
});

document.getElementById("search").addEventListener("input", function() {
    const value = this.value.toLowerCase().trim();

    if (!value) {
        visibleModels = [...models];
        shuffleArray(visibleModels);
        pageIndex = 0;
        loadPage();
        document.getElementById("profileSection").innerHTML = "";
        return;
    }

    const results = models.filter(model =>
        (model.ID || "").toLowerCase().includes(value) ||
        (model.Nickname || "").toLowerCase().includes(value) ||
        (model.Tags || "").toLowerCase().includes(value)
    );

    visibleModels = results;
    pageIndex = 0;
    document.getElementById("profileSection").innerHTML = "";

    loadPage();
});

function filterByTag(tag) {
    const value = tag.toLowerCase().trim();

    visibleModels = models.filter(model =>
        (model.Tags || "")
            .split(",")
            .some(item => item.trim().toLowerCase() === value)
    );

    pageIndex = 0;
    document.getElementById("search").value = tag;
    document.getElementById("profileSection").innerHTML = "";
    loadPage();

    window.scrollTo({
        top: document.getElementById("modelGrid").offsetTop - 20,
        behavior: "smooth"
    });
}

function loadModelsFromSheet() {
    const script = document.createElement("script");
    script.src = sheetURL;

    script.onerror = function() {
        document.getElementById("modelGrid").innerHTML =
            "<p style='text-align:center;color:#fff;'>Unable to load models right now.</p>";
    };

    document.body.appendChild(script);
}

fetch("media-manifest.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Media manifest HTTP " + response.status);
        }
        return response.json();
    })
    .then(data => {
        mediaManifest = data;

        if (models.length) {
            pageIndex = 0;
            loadPage();
        }
    })
    .catch(error => {
        console.error("Media manifest failed:", error);
    })
    .finally(() => {
        loadModelsFromSheet();
    });

function modelHubCallback(response) {
    if (response.status !== "ok") {
        document.getElementById("modelGrid").innerHTML = "<p style='text-align:center;color:#fff;'>Unable to load models right now.</p>";
        return;
    }

    const rows = response.table.rows;
    models = rows.slice(1).map(row => {
        const c = row.c || [];
        return {
            Nickname: c[0]?.v || "",
            Details: c[1]?.v || "",
            Tags: c[2]?.v || "",
            ID: c[3]?.v || "",
            Instagram: c[4]?.v || "",
            X: c[5]?.v || "",
            Stripchat: c[6]?.v || "",
            OnlyFans: c[7]?.v || "",
            Other: c[8]?.v || "",
            Media: c[9]?.v || ""
        };
    }).filter(model => model.ID);

    visibleModels = [...models];
    shuffleArray(visibleModels);
    loadPage();
}

