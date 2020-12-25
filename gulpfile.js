
let { src, dest } = require('gulp'), // присваиваем переменным пакеты
   gulp = require('gulp'),
   browsersync = require('browser-sync').create(),
   fileinclude = require('gulp-file-include'),
   del = require('del'),
   scss = require('gulp-sass'),
   autoprefixer = require('gulp-autoprefixer'),
   groupmedia = require('gulp-group-css-media-queries'),
   cleancss = require('gulp-clean-css'),
   rename = require('gulp-rename'),
   uglify = require('gulp-uglify-es').default,
   babel = require('gulp-babel'),
   imagemin = require('gulp-imagemin'),
   webp = require('gulp-webp'),
   webphtml = require('gulp-webp-html'),
   webpcss = require('gulp-webpcss'),
   svgsprite = require('gulp-svg-sprite'),
   ttf2woff = require('gulp-ttf2woff'),
   ttf2woff2 = require('gulp-ttf2woff2'),
   fonter = require('gulp-fonter'),
   newer = require('gulp-newer');
   

let project_folder = require('path').basename(__dirname)
let source_folder = '#src'; // папка с исходниками
let fs = require('fs');

let path = {  // пути к файлам
   build: {
      html: project_folder + '/',
      css: project_folder + '/css/',
      js: project_folder + '/js/',
      img: project_folder + '/img/',
      fonts: project_folder + '/fonts/',
   },
   src: {
      html: [source_folder + '/*.html', '!'+ source_folder + '/_*.html' ],
      css: source_folder + '/scss/style.scss',
      js: source_folder + '/js/script.js',
      img: source_folder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
      fonts: source_folder + '/fonts/*.ttf',
   },
   watch: {
      html: source_folder + '/**/*.html',
      css: source_folder + '/scss/**/*.scss',
      js: source_folder + '/js/**/*.js',
      img: source_folder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
   },
   clean: './' + project_folder + '/'
}

function browserSync() {
   browsersync.init({
      server: {
         baseDir: './' + project_folder + '/'
      },
      port: 3000,
      notify: false
   })
}

function html() {
   return src(path.src.html)
      .pipe(fileinclude())
      .pipe(webphtml())
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream())
}

function css() {
   return src(path.src.css)
      .pipe(scss({
         outputStyle: 'expanded'
      }))
      .pipe(groupmedia())
      .pipe(autoprefixer({
         overrideBrowserslist: ['last 5 versions'],
         cascade: true,
         grid: true
      }))
      .pipe(webpcss())
      .pipe(dest(path.build.css))
      .pipe(cleancss())
      .pipe(rename({extname: '.min.css'}))
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
}


function js() {
   return src(path.src.js)
      .pipe(fileinclude())
      .pipe(dest(path.build.js))
      .pipe(uglify())
      .pipe(rename({ extname: '.min.js' }))
      .pipe(babel())
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream())
}

function images() {
   return src(path.src.img)
      .pipe(newer(path.build.img))
      .pipe(webp({
         quality: 70
      }))
      .pipe(dest(path.build.img))
      .pipe(src(path.src.img))
      .pipe(newer(path.build.img))
      .pipe(imagemin({
         progressive: true,
         svgoPlugins: [{ removeViewBox: false }],
         interlaced: true,
         optimizationLevel: 3 // 0 to 7
      }))
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream())
}

function fonts() {
   src(path.src.fonts)
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts));
   return src(path.src.fonts)
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts));
}


gulp.task('otf2ttf', function () {
   return src([source_folder + '/fonts/*.otf'])
      .pipe(fonter({
         formats: ['ttf']
      }))
      .pipe(dest(source_folder + '/fonts/'));
}) // gulp otf2ttf для отдельного запуска

gulp.task('svgsprite', function () {
   return gulp.src([source_folder + '/iconsprite/*.svg'])
      .pipe(svgsprite({
         mode: {
            stack: {
               sprite: '../icons/icons.svg',
               // example: true 
            }
         }
      }))
      .pipe(dest(path.build.img))
}) // gulp svgsprite для запуска в отдельном терминале


function fontsStyle(params) {

   let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
      if (file_content == '') {
         fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
            return fs.readdir(path.build.fonts, function (err, items) {
               if (items) {
               let c_fontname;
                  for (var i = 0; i < items.length; i++) {
                  let fontname = items[i].split('.');
                  fontname = fontname[0];
                  if (c_fontname != fontname) {
                  fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                  }
                  c_fontname = fontname;
                  }
               }
         })
      }
   }
function cb() {

}


function watchFiles() {
   gulp.watch([path.watch.html], html).on('change', browsersync.reload); 
   gulp.watch([path.watch.css], css);
   gulp.watch([path.watch.js], js);
   gulp.watch([path.watch.img], images);
}

function clean() {
   return del(path.clean);
}


let build = gulp.series(clean, gulp.parallel(js, css, html, images,fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;