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
  //this sets the minimum swipe distance, to avoid noise and to filter actual swipes from just moving fingers
  _treshold = 100;
  onSwipeLeft;
  onSwipeRight;

  //Function to handle swipes
  _handleTouch() {
    //calculate the distance on x-axis and o y-axis. Check whether had the great moving ratio.
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

grist.ready({
  columns: [{ name: "ImageUrl", title: 'Image URL', type: 'Text' }],
  requiredAccess: 'read table',
});

// Helper function that reads first value from a table with a single column.
function singleColumn(record) {
  const columns = Object.keys(record || {}).filter(k => k !== 'id');
  return columns.length === 1 ? record[columns[0]] : undefined;
}

grist.onNewRecord(() => {
  showError("");
  viewer.style.display = 'none';
});
grist.onRecord(function (record) {
  // If user picked all columns, this helper function will return a mapped record.
  const mapped = grist.mapColumnNames(record);
  // We will fallback to reading a value from a single column to
  // support old way of mapping (exposing only a single column).
  // New widgets should only check if mapped object is truthy.
  const data = mapped ? mapped.ImageUrl : singleColumn(record);
  delete record.id;
  let showNavigation = false;
  if (data === undefined) {
    showError("Please choose a column to show in the Creator Panel.");
  } else {
    showError("");
    if (!data) {
      viewer.style.display = 'none';
    } else {
      const imageUrlRegex = /(https?:\/\/[^\s]+)/g;
      urls = data.match(imageUrlRegex) || [];
      imageRotator.setImages(urls);
      showNavigation = urls.length > 1;
    }
    toggleNavigationButtons(showNavigation);
  }
});
