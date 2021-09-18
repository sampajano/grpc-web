const connect = require('gulp-connect');
const gulp = require('gulp');

gulp.task('serve', () => {
  connect.server({
    root: '../../',
    port: 4000
  });
});
