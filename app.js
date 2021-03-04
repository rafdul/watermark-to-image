const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const answerAsk = async function() {
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you`ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  if(!answer.start) process.exit();
}

const inputImageAsk = async function() {
  const inputFile = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }]);

  if(fs.existsSync('./img/' + inputFile.inputImage)) {
    return inputFile.inputImage;
  } else {
    console.log('Something went wrong (with your input-file)... Try again');
    const inputFile = await inputImageAsk();
    return inputFile;
  }
}

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Success! Check folder ./img/ and try one more.');
    startApp();
  }
  catch(err) {
    console.log('Something went wrong... Try again');
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const watermarkFileNew = watermark.resize(100, Jimp.AUTO);
    const x = image.getWidth() / 2 - watermarkFileNew.getWidth() / 2;
    const y = image.getHeight() / 2 - watermarkFileNew.getHeight() / 2;
    image.composite(watermarkFileNew, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Success! Check folder ./img/ and try one more.');
    startApp();
  }
  catch(err) {
    console.log('Something went wrong... Try again');
  }
};

const makeNameImg = name => {
  const parts = name.split('.');
  return parts[0] + '-with-watermark.' + parts[1];
};

const makeNameEditImg = name => {
  const parts = name.split('.');
  return parts[0] + '-edit.' + parts[1];
}

const makeWatermark = async function(inputFile) {
  const optionsWatermark = await inquirer.prompt([{
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  }]);

  if(optionsWatermark.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    optionsWatermark.watermarkText = text.value;
    addTextWatermarkToImage('./img/'+ inputFile, `./img/${makeNameImg(inputFile)}`, optionsWatermark.watermarkText);
    console.log('inputFile', inputFile)
    
    checkFolder();
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    optionsWatermark.watermarkImage = image.filename;
    if (!fs.existsSync('./img/' + optionsWatermark.watermarkImage)) {
      console.log('Something went wrong (with your watermark file)... Try again');
      process.exit();
    }
    addImageWatermarkToImage('./img/' + inputFile, `./img/${makeNameImg(inputFile)}`, './img/' + optionsWatermark.watermarkImage);
    
    checkFolder();
  }
}

const makeImageBrighter = async function(inputFile, outputImage, brightness) {
  const img = await Jimp.read(inputFile);
  if(isNaN(Number(brightness.value))) throw new Error('Wrong brightness!');
  const brighterImg = img.brightness(Number(brightness.value));
  await brighterImg.quality(100).writeAsync(outputImage);
  
  inputFile = {inputImage: outputImage.slice(6)};
  makeWatermark(inputFile.inputImage);
}

const makeImageContrast = async function(inputFile, outputImage, contrast) {
  const img = await Jimp.read(inputFile);
  if(isNaN(Number(contrast.value))) throw new Error('Wrong contrast!');
  const contrastImg = img.contrast(Number(contrast.value));
  await contrastImg.quality(100).writeAsync(outputImage);
  inputFile = {inputImage: outputImage.slice(6)};
  makeWatermark(inputFile.inputImage);
}

const makeImageB_W = async function(inputFile, outputImage) {
  const img = await Jimp.read(inputFile);
  const bwImg = img.greyscale();
  await bwImg.quality(100).writeAsync(outputImage);
  inputFile = {inputImage: outputImage.slice(6)};
  makeWatermark(inputFile.inputImage);
}

const makeImageInvert = async function(inputFile, outputImage) {
  const img = await Jimp.read(inputFile);
  const invertImg = img.invert();
  await invertImg.quality(100).writeAsync(outputImage);
  inputFile = {inputImage: outputImage.slice(6)};
  makeWatermark(inputFile.inputImage);
}

const checkFolder= () => {
  const items = fs.readdirSync('./img/');
  for (let item of items) {
    if(item.indexOf('-edit.') > 0) {
      console.log('do usunięcia', item);
      fs.rmSync('./img/' + item);
    }
  }
}
  
const startApp = async () => {

  await answerAsk(); 

  const inputFile = await inputImageAsk();
  
  const editAsk = await inquirer.prompt([{
      name: 'answerEdit',
      type: 'confirm',
      message: 'Do you want to edit your file?'
    }]);
  
  if(editAsk.answerEdit) {
    const editOptions = await inquirer.prompt([{
      name: 'optionName',
      type: 'list',
      choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image'],
    }]);
    switch(editOptions.optionName) {
      case 'make image brighter':
        const brightness = await inquirer.prompt([{
          name: 'value',
          type:'input',
          message: 'Choose the brightness (between -1 and 1)',
          default: 0.5,
        }])
        makeImageBrighter('./img/' + inputFile, `./img/${makeNameEditImg(inputFile)}`, brightness);
        break;
      case 'increase contrast':
        const contrast = await inquirer.prompt([{
          name: 'value',
          type: 'input',
          message: 'Choose the contrast (between -1 and 1)',
          default: 0.5,
        }])
        makeImageContrast('./img/' + inputFile, `./img/${makeNameEditImg(inputFile)}`, contrast);
        break;
      case 'make image b&w':
        makeImageB_W('./img/' + inputFile, `./img/${makeNameEditImg(inputFile)}`);
        break;
      case 'invert image':
        makeImageInvert('./img/' + inputFile, `./img/${makeNameEditImg(inputFile)}`);
        break;
    }
  } else {
    makeWatermark(inputFile);
  }
}
  
startApp();