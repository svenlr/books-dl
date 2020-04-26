var viewer;
var $ = function (x) { return [].slice.call(document.querySelectorAll(x)) };
var PNG = require('node-png').PNG;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var makeImgDataGetter = function (canvas) {
  return function (img) {
    canvas.setAttribute('width', img.width * 1.8)
    canvas.setAttribute('height', img.height * 1.8)
    var context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    return context.getImageData(0, 0, img.width * 1.8, img.height * 1.8);
  }
}
var canvas = document.createElement("canvas");
var getImageData = makeImgDataGetter(canvas);


function getPageImage() {
  var id = viewer.getPageId()
  var num = viewer.getPageNumber()
  var img = $('#viewerCanvas img').filter(function (el) {
    return (new RegExp(id)).test(el.src);
  })[0];
  if (!img) return null;
  var res = getImageData(img);
  res.id = id;
  res.num = num;
  return res;
}

var prevId;
function nextPage() {
  var img = getPageImage();
  if (img) {
    var png = new PNG({ width: img.width, height: img.height})
    var file = path.join(outdir, img.num+'-'+img.id+'.png')
    png.data = img.data;
    png.pack().pipe(fs.createWriteStream(file));
  }
  prevId = viewer.getPageId();
  viewer.nextPage();
  if (viewer.getPageId() === prevId)
    alert('Done')
  else
    window.setTimeout(nextPage, 1000)
    // window.setTimeout(nextPage, 700 + Math.floor(Math.random()*1000))
}


var args = require('nw.gui').App.argv;
var bookid = args[0];
if (!bookid) {
  process.stderr.write('\nMissing <book-id> argument:\n')
  process.stderr.write('Usage:\n\tnw . <book-id>\n# See Supported Identifiers at https://developers.google.com/books/docs/viewer/developers_guide\n')
  process.exit(1);
}

var outdir = path.resolve(args[1] || '.');
mkdirp.sync(outdir);

var pageNumber = 1;
if (args.length >= 3) {
  pageNumber = args[2];
}

function go_to() {
  viewer.goToPage(pageNumber);
  setTimeout(nextPage, 3000);
}

google.load("books", "0");
google.setOnLoadCallback(function initialize() {
  viewer = new google.books.DefaultViewer(document.getElementById('viewerCanvas'));
  viewer.load(bookid);
  //
  setTimeout(go_to, 3000);
})
