// Initialize carousel structure
function createCarousel() {
  const container = document.getElementById('carousel-container');
  if (!container) {
    console.error('Carousel container not found');
    return;
  }

  container.innerHTML = `
    <input type="radio" name="slider" id="item-1" checked>
    <input type="radio" name="slider" id="item-2">
    <input type="radio" name="slider" id="item-3">
    <div class="cards">
      ${[1, 2, 3].map(i => `
        <label class="card" for="item-${i}" id="image-${i}">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" 
               alt="Loading...">
        </label>
      `).join('')}
    </div>
  `;
}

// Create carousel when DOM is ready
document.addEventListener('DOMContentLoaded', createCarousel);

let links = {
  county: '',
  streetView: '',
  coStar: '',
  gis: '',
  copy: ''
};

function updateLinks() {
  document.getElementById('county').href = links.county || '#';
  document.getElementById('street-view').href = links.streetView || '#';
  document.getElementById('co-star').href = links.coStar || '#';
  document.getElementById('gis').href = links.gis || '#';
}

function copyText() {
  const textToCopy = links.copy;
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      const copyBtn = document.getElementById('copy');
      copyBtn.textContent = "✅";
      setTimeout(() => copyBtn.textContent = "📋", 2000);
    }).catch(err => {
      console.error("Clipboard access denied.", err);
      showError("Clipboard access denied.");
    });
  } else {
    showError("No text available to copy.");
  }
}

function showError(msg) {
  const el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerText = msg;
    el.style.display = 'block';
  }
}

// Grist integration
grist.ready({
  columns: ["County", "Street_View", "CoStar", "GIS", "Copy", "ImageUrl"]
});

grist.onRecord(function(record) {
  const mapped = grist.mapColumnNames(record);
  
  // Update links
  links.county = mapped?.County || '';
  links.streetView = mapped?.Street_View || '';
  links.coStar = mapped?.CoStar || '';
  links.gis = mapped?.GIS || '';
  links.copy = mapped?.Copy || '';
  updateLinks();
  showError("");

  // Handle images
  const rawUrls = mapped?.ImageUrl || '';
  const imageUrls = rawUrls.split(' ').filter(url => url.trim() !== '');
  const cards = document.querySelectorAll('.card img');

  // Set default transparent placeholder
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  if (imageUrls.length === 0) {
    cards.forEach(card => {
      card.src = placeholder;
      card.alt = 'No images available';
    });
    return;
  }

  // Duplicate images to fill at least 3 slots
  let finalUrls = [...imageUrls];
  while (finalUrls.length < 3) {
    finalUrls = finalUrls.concat(finalUrls);
  }
  finalUrls = finalUrls.slice(0, 3);

  // Load images with error handling
  finalUrls.forEach((url, index) => {
    const img = new Image();
    img.src = url;
    
    img.onload = () => {
      cards[index].src = url;
      cards[index].alt = `Property Image ${index + 1}`;
    };
    
    img.onerror = () => {
      cards[index].src = placeholder;
      cards[index].alt = 'Image failed to load';
    };
  });
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
  document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
  document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
  document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
  document.getElementById('copy').addEventListener('click', copyText);
});

// Carousel automation
let currentIndex = 1;
const totalItems = 3;

function autoShuffle() {
  const radioButtons = document.querySelectorAll('input[name="slider"]');
  if (radioButtons.length === 3) {
    radioButtons[currentIndex - 1].checked = true;
    currentIndex = (currentIndex % totalItems) + 1;
  }
}

setInterval(autoShuffle, 3000);
