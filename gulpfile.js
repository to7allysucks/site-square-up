import gulp from 'gulp';
import fileInclude from 'gulp-file-include';
import { deleteAsync } from 'del';
import  * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import autoprefixer from 'gulp-autoprefixer';
import htmlmin from 'gulp-htmlmin';
import browserSync from 'browser-sync';

import babel from 'gulp-babel';
import terser from 'gulp-terser';

import stylelint from 'stylelint';
import htmlhint from 'gulp-htmlhint';

const sass = gulpSass(dartSass);
const bs = browserSync.create();

const paths = {
  html: {
    src: 'src/pages/**/*.html',
    dest: 'dist/',
    watch: ['src/pages/**/*.html', 'src/components/**/*.html'],
  },
  styles: {
    src: 'src/scss/main.scss',
    dest: 'dist/assets/css/',
    watch: 'src/scss/**/*.scss',
  },
  assets: {
    src: 'src/assets/**/*',
    dest: 'dist/assets/',
  },
  images: {
    src: 'src/assets/images/**/*',
    dest: 'dist/assets/images',
  },
  scripts: {
    src: 'src/assets/js/**/*.js',
    dest: 'dist/assets/js/',
    watch: 'src/assets/js/**/*.js',
  },
  lint: {
    scss: 'src/scss/**/*.scss',
    html: ['src/pages/**/*.html', 'src/components/**/*.html'],
  },
};

export const html = () =>
  gulp
    .src(paths.html.src)
    .pipe(
      fileInclude({
        prefix: '@@',

        basepath: 'src/components/',
      })
    )
    .pipe(
      htmlmin({
        collapseWhitespace: false,
        removeComments: true,
      })
    )
    .pipe(gulp.dest(paths.html.dest))
    .pipe(bs.stream());

export const styles = () =>
  gulp
    .src(paths.styles.src)
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(bs.stream());

export const scripts = () =>
  gulp
    .src(paths.scripts.src)
    .pipe(
      babel({
        presets: ['@babel/preset-env'],
      })
    )
    .pipe(terser())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(bs.stream());


export const assets = () =>
  gulp.src(paths.assets.src).pipe(gulp.dest(paths.assets.dest));

export const clean = () => deleteAsync(['dist']);

export const lintStyles = async () => {
  const result = await stylelint.lint({
    files: paths.lint.scss,
    formatter: 'string',
  });

  if (result.report) {
    console.log(result.report);
  }

  if (result.errored) {
    throw new Error('Stylelint found errors');
  }
};

export const lintHtml = () =>
  gulp
    .src(paths.lint.html)
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.failAfterError());

export const lintStylesDev = async () => {
  const result = await stylelint.lint({
    files: paths.lint.scss,
    formatter: 'string',
  });

  if (result.report) {
    console.log(result.report);
  }
};

export const lintHtmlDev = () =>
  gulp
    .src(paths.lint.html)
    .pipe(htmlhint('.htmlhintrc'))
    .pipe(htmlhint.reporter());

export const lint = gulp.parallel(lintStyles, lintHtml);

export const serve = () => {
  bs.init({
    server: {
      baseDir: './dist',
    },
    notify: false,
    open: true,
    cors: true,
  });

  gulp.watch(paths.styles.watch, gulp.series(lintStylesDev, styles));
  gulp.watch(paths.html.watch, gulp.series(lintHtmlDev, html));
  gulp.watch(paths.assets.src, assets);
  gulp.watch(paths.images.src);
  gulp.watch(paths.scripts.watch, scripts);
};


export const build = gulp.series(lint, clean, gulp.parallel(styles, html, assets, scripts));
export default gulp.series(build, serve);
