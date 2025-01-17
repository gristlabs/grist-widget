class ImageRotator {
  _urls = [];
  _urlIndex = 0;

  _getElement() {
    if (this.element === undefined || this.element === null || this.element === '') {
      this.viewer = document.getElementById(this.elementCssTag);
    }
    return this.viewer;
  }

  previousImage() {
    if (this._urlIndex > 0) {
      this._urlIndex--;
    } else {
      this._urlIndex = this._urls.length - 1;
    }
    this.showImage();
  }

  nextImage() {
    if (this._urlIndex < this._urls.length - 1) {
      this._urlIndex++;
    } else {
      this._urlIndex = 0;
    }
    this.showImage();
  }

  setImages(urls) {
    this._urls = urls;
    this._urlIndex = 0;
    this.showImage();
  }

  showImage() {
    const url = this._urls[this._urlIndex];
    const viewer = this._getElement();
    if (!url) {
      viewer.style.display = 'none';
    } else {
      viewer.src = url;
      viewer.alt = `URL: ${url}`; // When url does not point to an image, the url itself is shown as alt text.
      viewer.style.display = 'block';
    }
  }

  constructor(element) {
    this.elementCssTag = element;
  }
}

class SwipeHandler {
  _startX;
  _endX;
  _treshold = 100; // Minimum swipe distance
  onSwipeLeft;
  onSwipeRight;

  _handleTouch() {
    const xDist = this._endX - this._startX;
    if (Math.abs(xDist) > this._treshold) {
      if (xDist > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    }
  }

  constructor() {
    const viewer = document.getElementById('viewer');
    viewer.addEventListener('touchstart', (event) => {
      this._startX = event.touches[0].clientX;
    });
    viewer.addEventListener('touchend', (event) => {
      this._endX = event.changedTouches[0].clientX;
      this._handleTouch();
    });
  }
}

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
      copyBtn.textContent = "Copied!";
      setTimeout(() => copyBtn.textContent = "Copy", 2000);
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

// Initialize ImageRotator and SwipeHandler
let imageRotator;
let swipeHandler;
imageRotator = new ImageRotator('viewer');
swipeHandler = new SwipeHandler();
swipeHandler.onSwipeLeft = () => imageRotator.nextImage();
swipeHandler.onSwipeRight = () => imageRotator.previousImage();

window.onload = function () {
  if ('ontouchstart' in window) {
    var btns = document.getElementsByClassName('btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].style.display = 'none';
    }
  }
};

function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
  }
}

function toggleNavigationButtons(show = false) {
  const buttons = document.getElementById('navigation-buttons');
  if (show) {
    buttons.style.display = 'flex';
  } else {
    buttons.style.display = 'none';
  }
}
