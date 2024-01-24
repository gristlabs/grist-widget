class ImageRotator {
    _urls = [];
    _urlIndex = 0;

    PreviousImage() {
        if (this._urlIndex > 0) {
            this._urlIndex--;
        } else {
            this._urlIndex = this._urls.length - 1;
        }
        this.showImage();
    }

    NextImage() {
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
        let url = urls[this._urlIndex];
        if (!url) {
            this.viewer.style.display = 'none';
        }
        this.viewer.src = url;
        this.viewer.style.display = 'block';
    }

    constructor(element) {
        this.viewer = element;
    }
}

class SwipeHandler {
    _startX
    _endX
    //this sets the minimum swipe distance, to avoid noise and to filter actual swipes from just moving fingers
    _treshold = 100;

//Function to handle swipes
    _handleTouch() {
        //calculate the distance on x-axis and o y-axis. Check wheter had the great moving ratio.
        var xDist = this._endX - this._startX;
        if (Math.abs(xDist) > this._treshold) {
            if (xDist > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        }
    }

    onSwipeLeft
    onSwipeRight

    constructor() {
        let viewer = document.getElementById('viewer');
        viewer.addEventListener('touchstart', (event) => {
            this._startX = event.touches[0].clientX;

        })
        viewer.addEventListener('touchend', (event) => {
            this._endX = event.changedTouches[0].clientX;
            this._handleTouch()

        })
    }
}

let imageRotator
let swipeHandler
window.onload = function () {
    imageRotator = new ImageRotator(document.getElementById('viewer'));
    swipeHandler = new SwipeHandler();
    swipeHandler.onSwipeLeft = () => imageRotator.NextImage();
    swipeHandler.onSwipeRight = () => imageRotator.PreviousImage();
}

function showError(msg) {
    var el = document.getElementById('error')
    if (!msg) {
        el.style.display = 'none';
    } else {
        el.innerHTML = msg;
        el.style.display = 'block';
    }
}

function toggleNavigationButtons(show = false) {
    let buttons = document.getElementById('navigation-buttons');
    if (show) {
        buttons.style.display = 'flex'
    } else {
        buttons.style.display = 'none'
    }
}

grist.ready({
    columns: [{name: "ImageUrl", title: 'Image URL', type: 'Text'}],
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
    if (data === undefined) {
        showError("Please choose a column to show in the Creator Panel.");
    } else {
        showError("");
        if (!data) {
            viewer.style.display = 'none';
        } else {
            const imageUrlRegex = /(https?:\/\/[^\s]+)/g;
            urls = data.match(imageUrlRegex) || [];
            toggleNavigationButtons(urls.length > 1)
            imageRotator.setImages(urls)
        }
    }
});