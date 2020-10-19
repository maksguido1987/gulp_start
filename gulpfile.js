
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
   newer = require('gulp-newer');
   

let project_folder = 'dist'; // папка для выгрузки 
let source_folder = '#src'; // папка с исходниками

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
      img: source_folder + '/img/**/*.{jpg, png, svg, gif, webp}',
      fonts: source_folder + '/fonts/*.ttf',
   },
   watch: {
      html: source_folder + '/**/*.html',
      css: source_folder + '/scss/**/*.scss',
      js: source_folder + '/js/**/*.js',
      img: source_folder + '/img/**/*.{jpg, png, svg, gif, webp}',
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


function watchFiles() {
   gulp.watch([path.watch.html], html).on('change', browsersync.reload); 
   gulp.watch([path.watch.css], css);
   gulp.watch([path.watch.js], js);
   gulp.watch([path.watch.img], images);
}

function clean() {
   return del(path.clean);
}


let build = gulp.series(clean, gulp.parallel(js, css, html, images));
let watch = gulp.parallel(build, watchFiles, browserSync);



exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;