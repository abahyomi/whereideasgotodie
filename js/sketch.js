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
let vidh = 40;  // Para mejorar el rendimiento
let w, h;
let myFont;

let imageGrid = [];
let imageSpacing = 300; // Espaciado entre imágenes en el eje z
let numImagesPerRow = 10; // Número de imágenes en cada fila
let backImages = []; // Array para guardar imágenes traseras
let posterImage;
let showPoster = false; // Controla si el poster debe mostrarse
let posterAlpha = 255; // Transparencia del poster
let posterScale = 1; // Escala del póster
let posterPosition = { x: 0, y: 0 }; // Posición del póster
let draggingPoster = false; // Controla si se está arrastrando el póster
let offset = { x: 0, y: 0 }; // Offset para arrastrar el póster

function preload() {
  myFont = loadFont('assets/IBMPlexMono-Regular.ttf');
  
  // Cargar las imágenes disponibles
  for (let i = 1; i <= 5; i++) { // Cambia el 5 por el número máximo de imágenes en tu carpeta
    try {
      let img = loadImage(`assets/image${i}.jpg`); // Asegúrate de usar la ruta correcta
      backImages.push(img);
    } catch (error) {
      console.log(`Imagen image${i}.jpg no encontrada, omitiendo.`);
    }
  }
  // Cargar la imagen del poster
  posterImage = loadImage('assets/poster1.jpg'); // Asegúrate de usar la ruta correcta
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
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
    
    leftImage.background(255);
    rightImage.background(255);

    let randomBackImage = random(backImages);

    imageGrid.push({
      x: -width / 4, y: 0, z: i * imageSpacing,
      imgFront: leftImage, imgBack: randomBackImage, 
      angle: 0, isHovering: false
    });

    imageGrid.push({
      x: width / 4, y: 0, z: i * imageSpacing,
      imgFront: rightImage, imgBack: randomBackImage,
      angle: 0, isHovering: false
    });
  }

  const changeAsciiButton = document.getElementById('changeAsciiButton');
  changeAsciiButton.addEventListener('click', changeAsciiStyle);

  // Iniciar el temporizador para mostrar el poster después de 10 segundos
  setTimeout(() => {
    showPoster = true;
  }, 10000);
}

function draw() {
  background(0);

  // Primero dibuja las imágenes
  for (let i = 0; i < imageGrid.length; i++) {
    let imgData = imageGrid[i];
    let xPos = imgData.x;
    let yPos = imgData.y;
    let zPos = imgData.z;

    // Calcular posición del mouse en coordenadas relativas
    let screenXPos = width / 2 + xPos;
    let screenYPos = height / 2 + yPos;

    // Comprobar si el mouse está sobre este bloque individualmente
    imgData.isHovering = (mouseX > screenXPos - 50 && mouseX < screenXPos + 50) &&
                         (mouseY > screenYPos - 75 && mouseY < screenYPos + 75);

    push();
    translate(xPos, yPos, -zPos);

    // Control de rotación por imagen
    if (imgData.isHovering) {
      imgData.angle = min(imgData.angle + 0.3, PI); // Incrementa el ángulo si está hover
    } else {
      imgData.angle = max(imgData.angle - 0.3, 0); // Reduce el ángulo si no está hover
    }

    rotateY(imgData.angle); // Rotación en Y solo para este bloque

    // Alternar entre la imagen frontal y trasera según el ángulo
    let currentImage = imgData.angle >= PI / 2 ? imgData.imgBack : imgData.imgFront;
    
    imageMode(CENTER);
    image(currentImage, 0, 0, 100, 150); // Dibuja la imagen actual

    pop();

    // Mover la posición en el eje Z
    imgData.z -= 5;

    // Reiniciar la posición z si se mueve fuera de la pantalla
    if (imgData.z < -imageSpacing) {
      imgData.z = (numImagesPerRow - 1) * imageSpacing;
    }
  }

  // Mostrar el poster si showPoster es verdadero
  if (showPoster) {
    push();
    translate(posterPosition.x, posterPosition.y, -500); // Asegúrate de que esté detrás de otros elementos
    tint(255, posterAlpha); // Aplicar transparencia

    // Mantener el aspecto original del póster
    let scaledWidth = posterImage.width * posterScale; // Escalar basado en la escala
    let scaledHeight = posterImage.height * posterScale; // Escalar basado en la escala

    imageMode(CENTER);
    image(posterImage, 0, 0, scaledWidth, scaledHeight); // Cambia el tamaño según lo necesites
    pop();
    
    // Dibujar el texto al lado del poster
    fill(255);
    textSize(32);
    textAlign(LEFT);
    text("poster generado mediante trackeo de tus movimientos", width * 0.5 + 20, 0); // Ajustar la posición
  }

  // Finalmente, dibuja el fondo ASCII
  if (video.loadedmetadata) {
    drawAsciiBackground();
  } else {
    console.log("Esperando a que el video se cargue...");
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
        
        fill(255);
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

// Detectar movimiento del ratón
function mouseMoved() {
  if (showPoster) {
    // Comprobar si el mouse está sobre el póster
    let posterWidth = posterImage.width * posterScale;
    let posterHeight = posterImage.height * posterScale;

    if (mouseX > width / 2 - posterWidth / 2 && mouseX < width / 2 + posterWidth / 2 &&
        mouseY > height / 2 - posterHeight / 2 && mouseY < height / 2 + posterHeight / 2) {
      // Cambiar el cursor
      cursor(HAND);
    } else {
      cursor(ARROW);
    }
  }
}

// Detectar clic para ampliar y mover el póster
function mousePressed() {
  if (showPoster) {
    // Comprobar si el mouse está sobre el póster
    let posterWidth = posterImage.width * posterScale;
    let posterHeight = posterImage.height * posterScale;

    if (mouseX > width / 2 - posterWidth / 2 && mouseX < width / 2 + posterWidth / 2 &&
        mouseY > height / 2 - posterHeight / 2 && mouseY < height / 2 + posterHeight / 2) {
      // Ampliar el póster al hacer clic
      posterScale = posterScale === 1 ? 1.5 : 1; // Alternar tamaño entre 1 y 1.5
    } else {
      // Comenzar a arrastrar el póster
      draggingPoster = true;
      offset.x = mouseX - posterPosition.x;
      offset.y = mouseY - posterPosition.y;
    }
  }
}

function mouseReleased() {
  // Detener el arrastre del póster
  draggingPoster = false;
}

function mouseDragged() {
  if (draggingPoster) {
    // Mover el póster mientras se arrastra
    posterPosition.x = mouseX - offset.x;
    posterPosition.y = mouseY - offset.y;
  }
}
