let asciiCharSets = [
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,^`'. ",
  " .:-=+*#%@",
  " .:░▒▓█",
  "@%#*+=-:. "
];
let currentAsciiSet = 0;
let asciiChar = asciiCharSets[currentAsciiSet];

let video;
let vidw = 75; // Ajustar la resolución aquí
let vidh = 40; // Para mejorar el rendimiento
let w, h;
let myFont;

let imageGrid = [];
let imageSpacing = 300;
let numImagesPerRow = 10;
let backImages = [];
let posterImages = [];
let posterImage;
let showPoster = false;
let posterAlpha = 0;
let posterScale = 0.5;
let posterPosition = { x: 0, y: 0 };
let draggingPoster = false;
let offset = { x: 0, y: 0 };

function preload() {
  myFont = loadFont('assets/IBMPlexMono-Regular.ttf');

  // Cargar imágenes de fondo
  for (let i = 1; i <= 21; i++) {
    try {
      let img = loadImage(`assets/${i}.png`);
      backImages.push(img);
    } catch (error) {
      console.log(`Imagen ${i}.jpg no encontrada, omitiendo.`);
    }
  }
  // Cargar los pósters
  for (let i = 1; i <= 3; i++) {
    posterImages.push(loadImage(`assets/poster${i}.png`));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(myFont);

  video = createCapture(VIDEO, function (stream) {
    console.log("Video capturado con éxito");
    video.size(vidw, vidh);
    video.hide();
    w = width / video.width;
    h = height / video.height;
  });

  // Crear la cuadrícula de imágenes en perspectiva
  for (let i = 0; i < numImagesPerRow; i++) {
    let leftImage = createGraphics(100, 250);
    let rightImage = createGraphics(100, 150);
    leftImage.background("#FBFAF2");
    rightImage.background("#FBFAF2");
    let randomBackImage = random(backImages);
    imageGrid.push({
      x: -width / 4,
      y: 0,
      z: i * imageSpacing,
      imgFront: leftImage,
      imgBack: randomBackImage,
      angle: 0,
      isHovering: false,
    });
    imageGrid.push({
      x: width / 4,
      y: 0,
      z: i * imageSpacing,
      imgFront: rightImage,
      imgBack: randomBackImage,
      angle: 0,
      isHovering: false,
    });
  }

  const changeAsciiButton = document.getElementById("changeAsciiButton");
  changeAsciiButton.addEventListener("click", changeAsciiStyle);

  // Seleccionar un póster aleatorio y mostrarlo después de 10 segundos
  setTimeout(() => {
    posterImage = random(posterImages);
    showPoster = true;
    downloadButton.style.display = 'block'; // Mostrar el botón de descarga
  }, 10000);
}

// Botón de descarga para el póster
const downloadButton = document.getElementById('downloadButton');
downloadButton.addEventListener('click', () => {
  if (posterImage) {
    let tempGraphics = createGraphics(posterImage.width, posterImage.height);
    tempGraphics.image(posterImage, 0, 0);

    tempGraphics.canvas.toBlob(function(blob) {
      let link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'poster.jpg';
      link.click();
    });
  }
});

function draw() {
  background(0);

  // Dibujar imágenes en perspectiva
  for (let i = 0; i < imageGrid.length; i++) {
    let imgData = imageGrid[i];
    let xPos = imgData.x;
    let yPos = imgData.y;
    let zPos = imgData.z;

    imgData.isHovering =
      mouseX > width / 2 + xPos - 50 &&
      mouseX < width / 2 + xPos + 50 &&
      mouseY > height / 2 + yPos - 75 &&
      mouseY < height / 2 + yPos + 75;

    push();
    translate(xPos, yPos, -zPos);

    if (imgData.isHovering) {
      imgData.angle = min(imgData.angle + 0.3, PI);
    } else {
      imgData.angle = max(imgData.angle - 0.3, 0);
    }

    rotateY(imgData.angle);
    let currentImage = imgData.angle >= PI / 2 ? imgData.imgBack : imgData.imgFront;
    imageMode(CENTER);
    image(currentImage, 0, 0, 100, 150);

    pop();

    imgData.z -= 8;
    if (imgData.z < -imageSpacing) {
      imgData.z = (numImagesPerRow - 1) * imageSpacing;
    }
  }

  // Mostrar póster con animación de transparencia y escala
  if (showPoster) {
    posterAlpha = min(posterAlpha + 5, 255);
    posterScale = min(posterScale + 0.02, 1);
    push();
    translate(posterPosition.x, posterPosition.y, 1);
    tint(255, posterAlpha);
    let scaledWidth = posterImage.width * posterScale;
    let scaledHeight = posterImage.height * posterScale;
    imageMode(CENTER);
    image(posterImage, 0, 0, scaledWidth, scaledHeight);
    pop();

    fill(255);
    textSize(32);
    textAlign(LEFT);
    text(
      "Poster generado mediante trackeo de tus movimientos",
      width * 0.5 + 20,
      0
    );
  }

  if (video.loadedmetadata) {
    drawAsciiBackground();
  }
}

function drawAsciiBackground() {
  video.loadPixels();
  if (video.pixels.length > 0) {
    for (let i = 0; i < video.width; i++) {
      for (let j = 0; j < video.height; j++) {
        let pixelIndex = (i + j * video.width) * 4;
        let r = video.pixels[pixelIndex + 0];
        let g = video.pixels[pixelIndex + 1];
        let b = video.pixels[pixelIndex + 2];

        let bright = (r + g + b) / 3;
        let tIndex = floor(map(bright, 0, 255, 0, asciiChar.length));

        let x = i * w + w / 2;
        let y = j * h + h / 2;
        let t = asciiChar.charAt(tIndex);

        fill("#E8E5D2");
        textSize(w * 0.6);
        textAlign(CENTER, CENTER);
        text(t, x - width / 2, y - height / 2);
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (video) {
    w = width / video.width;
    h = height / video.height;
  }
}

function changeAsciiStyle() {
  currentAsciiSet = (currentAsciiSet + 1) % asciiCharSets.length;
  asciiChar = asciiCharSets[currentAsciiSet];
}

function mouseMoved() {
  if (showPoster) {
    let posterWidth = posterImage.width * posterScale;
    let posterHeight = posterImage.height * posterScale;

    if (
      mouseX > width / 2 - posterWidth / 2 &&
      mouseX < width / 2 + posterWidth / 2 &&
      mouseY > height / 2 - posterHeight / 2 &&
      mouseY < height / 2 + posterHeight / 2
    ) {
      cursor(HAND);
    } else {
      cursor(ARROW);
    }
  }
}

function mousePressed() {
  if (showPoster) {
    draggingPoster = true;
    offset.x = mouseX - posterPosition.x;
    offset.y = mouseY - posterPosition.y;
  }
}

function mouseReleased() {
  draggingPoster = false;
}

function mouseDragged() {
  if (draggingPoster) {
    posterPosition.x = mouseX - offset.x;
    posterPosition.y = mouseY - offset.y;
  }
}
