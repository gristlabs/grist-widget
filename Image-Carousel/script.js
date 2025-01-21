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
  const carouselContainer = document.getElementById('carousel-container');
  carouselContainer.innerHTML = ''; // Clear existing content

  if (imageUrls.length === 0) {
    showError("No images available.");
    return;
  }

  // Create radio buttons and cards dynamically
  imageUrls.forEach((url, index) => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'slider';
    radio.id = `item-${index + 1}`;
    if (index === 0) radio.checked = true; // Select the first item by default

    const label = document.createElement('label');
    label.className = 'card';
    label.htmlFor = `item-${index + 1}`;
    label.id = `image-${index + 1}`;

    const img = document.createElement('img');
    img.src = url;
    img.alt = `Property Image ${index + 1}`;

    label.appendChild(img);
    carouselContainer.appendChild(radio);
    carouselContainer.appendChild(label);
  });

  totalItems = imageUrls.length;
}

function autoShuffle() {
  if (totalItems === 0) return;

  const radioButtons = document.querySelectorAll('input[name="slider"]');
  if (radioButtons[currentIndex]) {
    radioButtons[currentIndex].checked = true;
  }
  currentIndex = (currentIndex + 1) % totalItems; // Move to the next image
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
