let asciiCharSets = [
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,^`'. ",
  " .:-=+*#%@",
  " .:░▒▓█",
  "@%#*+=-:. "
];
let currentAsciiSet = 0;
let asciiChar = asciiCharSets[currentAsciiSet];

let video;
let vidw = 95; // Ajustar la resolución aquí
let vidh = 50;  // Para mejorar el rendimiento
let w, h;
let myFont;

let imageGrid = [];
let imageSpacing = 300; // Espaciado entre imágenes en el eje z
let numImagesPerRow = 10; // Número de imágenes en cada fila

function preload() {
  // Cargar la fuente
  myFont = loadFont('assets/IBMPlexMono-Regular.ttf'); // Asegúrate de tener la fuente en esta ruta
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Usar la fuente cargada
  textFont(myFont);
  
  video = createCapture(VIDEO, function(stream) {
    console.log("Video capturado con éxito");
    video.size(vidw, vidh);
    video.hide();
    w = width / video.width;
    h = height / video.height;
  });

  // Crear la cuadrícula de imágenes en perspectiva
  for (let i = 0; i < numImagesPerRow; i++) {
    let leftImage = createGraphics(100, 150);
    let rightImage = createGraphics(100, 150);
    leftImage.background(255);  // Cambia el fondo de la imagen a blanco
    rightImage.background(255);

    imageGrid.push({ x: -width / 4, y: 0, z: i * imageSpacing, img: leftImage });
    imageGrid.push({ x: width / 4, y: 0, z: i * imageSpacing, img: rightImage });
  }

  const changeAsciiButton = document.getElementById('changeAsciiButton');
  changeAsciiButton.addEventListener('click', changeAsciiStyle);
}

function draw() {
  background(0);

  if (video.loadedmetadata) {
    drawAsciiBackground();
  } else {
    console.log("Esperando a que el video se cargue...");
  }

  

  // Dibujar las imágenes en perspectiva
  for (let i = 0; i < imageGrid.length; i++) {
    let imgData = imageGrid[i];

    // Calcular la escala en función de la posición z y la perspectiva
    let imgScale = map(imgData.z, 0, (numImagesPerRow - 1) * imageSpacing, 1, 0.2);
    let perspectiveEffect = map(imgData.z, 0, (numImagesPerRow - 1) * imageSpacing, 1, 0.5); // Ajustar la perspectiva
    let xPos = imgData.x * imgScale;
    let yPos = imgData.y * imgScale;
    let zPos = imgData.z;

    // Verificar si el mouse está sobre la imagen
    let mouseXRelative = (mouseX - width / 2) / imgScale; // Ajustar la posición del mouse
    let mouseYRelative = (mouseY - height / 2) / imgScale; // Ajustar la posición del mouse
    let isHovering = (mouseXRelative > xPos - 50 && mouseXRelative < xPos + 50) &&
                     (mouseYRelative > yPos - 75 && mouseYRelative < yPos + 75);

    push();
    translate(xPos, yPos, -zPos);
    imageMode(CENTER);
    
    // Aplicar la escala
    let hoverScale = isHovering ? 1.5 : 1; // Aumentar el tamaño al hacer hover
    scale(imgScale * perspectiveEffect * hoverScale); // Aplicar la perspectiva en la escala
    
    // Ajustar el color para el efecto de desvanecimiento
    let alpha = map(imgData.z, (numImagesPerRow - 1) * imageSpacing, 0, 255, 0);
    fill(255, alpha); // Establecer el color de llenado con transparencia
    image(imgData.img, 0, 0);
    pop();

    // Hacer que las imágenes se muevan más rápido
    imgData.z -= 5; // Aumentar la velocidad de movimiento aquí

    // Reiniciar la posición z cuando la imagen se haya movido fuera de la pantalla
    if (imgData.z < -imageSpacing) {
      imgData.z = (numImagesPerRow - 1) * imageSpacing; // Reiniciar la posición z
    }
  }

  
}

function drawAsciiBackground() {
  video.loadPixels();
  console.log("Longitud de los píxeles del video:", video.pixels.length);

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
        
        fill(255);
        textSize(w * 0.6); // Puedes ajustar este valor si es necesario
        textAlign(CENTER, CENTER);
        text(t, x - width / 2, y - height / 2);
      }
    }
  } else {
    console.log("No se han cargado los píxeles del video.");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Comprobamos si el video existe antes de acceder a sus propiedades
  if (video) {
    w = width / video.width;
    h = height / video.height;
  }
}

function changeAsciiStyle() {
  currentAsciiSet = (currentAsciiSet + 1) % asciiCharSets.length;
  asciiChar = asciiCharSets[currentAsciiSet];
}
