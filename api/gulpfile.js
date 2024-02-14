import gulp from 'gulp'
import ts from 'gulp-typescript'
const JSON_FILES = ['src/*.json', 'src/**/*.json', './url-rewrite.json'];

// pull in the project TypeScript config

gulp.task('assets', function () {
  return gulp.src(JSON_FILES)
    .pipe(gulp.dest('dist'));
});

gulp.task('urlrewrite', function () {
  return gulp.src(['url-rewrite.json'])
    .pipe(gulp.dest('data/fileprovider'));
});

gulp.task('default', gulp.series('assets', 'urlrewrite'));