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
      copyBtn.innerHTML = "Copied!";
      setTimeout(() => copyBtn.innerHTML = "Copy", 2000);
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

// Initialize Swiper
const swiper = new Swiper('.swiper-container', {
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  loop: true, // Enable infinite loop
  autoplay: {
    delay: 3000, // Auto-slide every 3 seconds
    disableOnInteraction: false, // Continue autoplay after user interaction
  },
});

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
  swiper.removeAllSlides();
  imageUrls.forEach(url => {
    swiper.appendSlide(`
      <div class="swiper-slide">
        <img src="${url}" alt="Property Image" />
      </div>
    `);
  });
});

// Add event listeners to buttons
document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
document.getElementById('copy').addEventListener('click', copyText);
