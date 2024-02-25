const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./model'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./model'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./model'),
  faceapi.nets.faceExpressionNet.loadFromUri('./model'),
  faceapi.nets.ageGenderNet.loadFromUri('./model')
]).then(startVideo)

function startVideo() {
  const constraints = {
    audio: false,
    video: { facingMode: 'environment' } // Bu, arka kamerayı kullanır
    // video: { facingMode: 'user' } // Bu, ön kamerayı kullanır
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  const displaySize = { width: video.width, height: video.height }
  
  document.body.append(canvas)
  
  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors()
      .withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

    resizedDetections.forEach(detection => {
      const { expressions, age, gender } = detection
      const box = detection.detection.box
      const roundedAge = Math.round(age)
      let expressionText = ''

      if (expressions) {
        const sortedExpressions = Object.entries(expressions)
          .sort(([, a], [, b]) => b - a)
        const [dominantExpression] = sortedExpressions

        if (dominantExpression[0] === 'neutral') {
          expressionText = 'Duygu: Normal'
        } else if (dominantExpression[0] === 'happy') {
          expressionText = 'Duygu: Mutlu'
        } else if (dominantExpression[0] === 'sad') {
          expressionText = 'Duygu: Üzgün'
        } else if (dominantExpression[0] === 'angry') {
          expressionText = 'Duygu: Kızgın'
        } else if (dominantExpression[0] === 'fearful') {
          expressionText = 'Duygu: Korkmuş'
        } else if (dominantExpression[0] === 'disgusted') {
          expressionText = 'Duygu: İğrenmiş'
        } else if (dominantExpression[0] === 'surprised') {
          expressionText = 'Duygu: Şaşırmış'
        } else { 
          expressionText = 'Duygu: -'
        }
      }

      let ageText = `Yaş: ${roundedAge}`
      let genderText = ''

      if (gender === 'male') {
        genderText = 'Cinsiyet: Erkek'
      } else {
        genderText = 'Cinsiyet: Kadın'
      }

      new faceapi.draw.DrawTextField([genderText], box.topRight).draw(canvas)
      new faceapi.draw.DrawTextField([ageText], box.bottomRight).draw(canvas)
      new faceapi.draw.DrawTextField([expressionText], box.bottomLeft).draw(canvas)
    })
  }
  , 100)
});
