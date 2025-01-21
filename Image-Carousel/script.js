let links = {
  county: '',
  streetView: '',
  coStar: '',
  gis: '',
  copy: '',
  ImageUrl: ''
};

let currentIndex = 0;
let totalItems = 0;
let autoShuffleInterval;

function updateLinks() {
  document.getElementById('county').href = links.county || '#';
  document.getElementById('street-view').href = links.streetView || '#';
  document.getElementById('co-star').href = links.coStar || '#';
  document.getElementById('gis').href = links.gis || '#';
}

function copyText() {
  const textToCopy = links.copy;
  if (textToCopy) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      const copyBtn = document.getElementById('copy');
      copyBtn.textContent = "✅";
      setTimeout(() => copyBtn.textContent = "📋", 2000);
    } catch (err) {
      console.error("Clipboard access denied.", err);
      showError("Clipboard access denied.");
    }
    document.body.removeChild(tempTextArea);
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

function createCarousel(imageUrls) {
  const carousel = document.getElementById('carousel');
  carousel.innerHTML = ''; // Clear existing content

  if (imageUrls.length === 0) {
    showError("No images available.");
    return;
  }

  imageUrls.forEach((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = `Property Image ${index + 1}`;
    img.style.display = index === 0 ? 'block' : 'none'; // Show the first image
    carousel.appendChild(img);
  });

  totalItems = imageUrls.length;
}

function autoShuffle() {
  if (totalItems === 0) return;

  const images = document.querySelectorAll('#carousel img');
  images[currentIndex].style.display = 'none'; // Hide the current image
  currentIndex = (currentIndex + 1) % totalItems; // Move to the next image
  images[currentIndex].style.display = 'block'; // Show the next image
}

// Grist integration
grist.ready({
  columns: ["County", "Street_View", "CoStar", "GIS", "Copy", "ImageUrl"]
});

grist.onRecord(function(record) {
  const mapped = grist.mapColumnNames(record);
  
  links.county = mapped?.County || '';
  links.streetView = mapped?.Street_View || '';
  links.coStar = mapped?.CoStar || '';
  links.gis = mapped?.GIS || '';
  links.copy = mapped?.Copy || '';
  links.ImageUrl = mapped?.ImageUrl || '';

  updateLinks();
  showError("");

  // Update the image carousel
  const imageUrls = links.ImageUrl.split(' ').filter(url => url.trim() !== '');
  createCarousel(imageUrls);

  // Restart auto-shuffling
  clearInterval(autoShuffleInterval);
  if (imageUrls.length > 0) {
    autoShuffleInterval = setInterval(autoShuffle, 3000);
  }
});

// Add event listeners
document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
document.getElementById('copy').addEventListener('click', copyText);
