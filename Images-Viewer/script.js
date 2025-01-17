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
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => copyBtn.textContent = "📋 Copy", 2000);
    }).catch(err => {
      console.error("Clipboard access denied.", err);
    });
  }
}

// Initialize Swiper
const swiper = new Swiper('.swiper-container', {
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  loop: true,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
});

// Function to check if an image is wide
function isWideImage(img) {
  return img.naturalWidth > img.naturalHeight;
}

// Function to create a slide with one or two images
function createSlide(images) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';
  slide.style.display = 'flex';
  slide.style.justifyContent = 'center';
  slide.style.alignItems = 'center';
  slide.style.gap = '10px'; // Spacing between images

  images.forEach(img => {
    const imgElement = document.createElement('img');
    imgElement.src = img.src;
    imgElement.alt = 'Property Image';
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '100%';
    imgElement.style.objectFit = 'contain';
    slide.appendChild(imgElement);
  });

  return slide;
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

  // Update the image carousel
  const imageUrls = mapped?.ImageUrl?.split(' ') || [];
  swiper.removeAllSlides();

  // Load images and check their dimensions
  const imagePromises = imageUrls.map(url => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // Handle broken images
    });
  });

  Promise.all(imagePromises).then(images => {
    const validImages = images.filter(img => img !== null); // Filter out broken images
    let currentSlideImages = [];

    validImages.forEach((img, index) => {
      if (isWideImage(img)) {
        // If the image is wide, add it as a single slide
        if (currentSlideImages.length > 0) {
          swiper.appendSlide(createSlide(currentSlideImages));
          currentSlideImages = [];
        }
        swiper.appendSlide(createSlide([img]));
      } else {
        // If the image is not wide, add it to the current slide
        currentSlideImages.push(img);
        if (currentSlideImages.length === 2 || index === validImages.length - 1) {
          // Add the slide when we have 2 images or reach the end
          swiper.appendSlide(createSlide(currentSlideImages));
          currentSlideImages = [];
        }
      }
    });
  });
});

// Add event listeners
document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
document.getElementById('copy').addEventListener('click', copyText);
