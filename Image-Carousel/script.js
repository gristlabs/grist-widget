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

  updateLinks();
  showError("");

  // Update the image carousel
  const imageUrls = mapped?.ImageUrl?.split(' ') || [];
  const cards = document.querySelectorAll('.card');

  // Clear existing images and hide unused cards
  cards.forEach((card, index) => {
    const img = card.querySelector('img');
    if (index < imageUrls.length) {
      img.src = imageUrls[index];
      card.style.display = 'block';
    } else {
      img.src = '';
      card.style.display = 'none';
    }
  });

  // Adjust carousel logic based on the number of images
  const totalItems = imageUrls.length;
  if (totalItems > 0) {
    document.getElementById('item-1').checked = true;
  }
});

// Add event listeners
document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
document.getElementById('copy').addEventListener('click', copyText);

// Automatic shuffling for the carousel
let currentIndex = 1;
const totalCards = 3; // Total number of cards in the carousel

function autoShuffle() {
  const radioButtons = document.querySelectorAll('input[name="slider"]');
  const imageUrls = links.ImageUrl?.split(' ') || [];
  const totalItems = imageUrls.length;

  if (totalItems > 0) {
    if (radioButtons[currentIndex - 1]) {
      radioButtons[currentIndex - 1].checked = true;
    }
    currentIndex = (currentIndex % totalItems) + 1; // Move to the next image
  }
}

// Set interval for automatic shuffling (e.g., every 3 seconds)
setInterval(autoShuffle, 3000);
