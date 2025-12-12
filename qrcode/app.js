function qrcode(qr) {
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );
  //   const size = 0.92 * Math.min(vw, vh);
  const canvas = document.createElement("canvas");

  const size = parseInt(sizeInput.value);
  const color = colorInput.value;
  const bgColor = bgColorInput.value;

  new QRious({
    element: canvas,
    level: "L",
    size,
    value: qr,
    background: bgColor,
    foreground: color,
  });
  return canvas;
}

// Éléments DOM
const sizeInput = document.getElementById("size-input");
const colorInput = document.getElementById("color-input");
const bgColorInput = document.getElementById("bg-color-input");

grist.ready({
  columns: ["QR"],
  requiredAccess: "read table",
});

grist.onRecord(function (record) {
  const content = document.getElementById("qr-container");
  const { QR } = grist.mapColumnNames(record);

  function update_qr() {
    content.innerHTML = "";
    content.appendChild(qrcode(QR));
  }

  update_qr();

  window.addEventListener("resize", update_qr);
  [sizeInput, colorInput, bgColorInput].forEach((input) => {
    input.addEventListener("change", update_qr);
    input.addEventListener("input", update_qr);
  });
});
