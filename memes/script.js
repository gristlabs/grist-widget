/**
 * Scale an element to the available space.
 */
function scaleBasedOnWindow(elm, scale=1, fit=false){
  if (!fit) {
    elm.style.transform='scale('+scale/Math.min(elm.clientWidth/window.innerWidth,elm.clientHeight/window.innerHeight)+')';
  } else{
    elm.style.transform='scale('+scale/Math.max(elm.clientWidth/window.innerWidth,elm.clientHeight/window.innerHeight)+')';
  }
}

/**
 * Normalize end of line characters.
 */
function toMultiLine(txt){
  txt = txt.replace(/\n\r/g, '\n');
  txt = txt.replace(/\r\n/g, '\n');
  return txt.split("\n");
}

/**
 * Prepare to render meme on a canvas once the
 * image loads.
 */
function setup(ctx, cvs, background, texts) {

  const img1 = new Image();

  img1.onload = function () {
    cvs.width = img1.width;
    cvs.height = img1.height;
    scaleBasedOnWindow(cvs, 1, true);
    ctx.drawImage(img1, 0, 0);
    const fontScale = cvs.width / 10.0;
    
    for (const text of texts) {
      const px = Math.round(fontScale * text.Size / 100.0);
      const fontSetting = "bold " + px + "px Impact";
      ctx.font = fontSetting;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const input = text.Text;
      const inputs = toMultiLine(input);
      const pad = Math.round(px/4);
      let htotal = -pad;
      const sizes = inputs.map(input => {
        const box = ctx.measureText(input);
        const w = box.width;
        const h = box.actualBoundingBoxAscent + box.actualBoundingBoxDescent;
        htotal += h + pad;
        return { w, h };
      });
      const nlines = inputs.length;
      const x0 = Math.round((img1.width) / 100.0 * text.Right);
      const y0 = Math.round((img1.height) / 100.0 * (100 - text.Up));
      if (nlines >= 1) {
        let dy = - (htotal - sizes[0].h / 2 - sizes[nlines-1].h / 2) / 2;
        for (let i = 0; i < nlines; i++) {
          const line = inputs[i];
          const size = sizes[i];
          ctx.fillStyle = "white";
          ctx.fillText(line, x0, y0+dy, size.w + 50);
          ctx.fillStyle = "black";
          ctx.strokeText(line, x0, y0+dy, size.w + 50);
          if (i+1 < nlines) {
            dy += size.h/2 + pad + sizes[i+1].h/2;
          }
        }
      }
    }
  };

  img1.src = background;
}

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  const cvs = document.getElementById('show');

  grist.ready();
  let lastRecord = null;
  function update(record) {
    if (record) {
      lastRecord = record;
    }
    record = lastRecord;
    if (!record) { return; }
    setup(cvs.getContext('2d'), cvs, record.Image, record.Texts);
  }
  grist.onRecord(function(record) {
    update(record);
  });

  window.addEventListener('resize', function(event) {
    update();
  }, true);
});

