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

    // Add event listeners
    document.getElementById('county').addEventListener('click', () => window.open(links.county, '_blank'));
    document.getElementById('gis').addEventListener('click', () => window.open(links.gis, '_blank'));
    document.getElementById('co-star').addEventListener('click', () => window.open(links.coStar, '_blank'));
    document.getElementById('street-view').addEventListener('click', () => window.open(links.streetView, '_blank'));
    document.getElementById('copy').addEventListener('click', copyText);
