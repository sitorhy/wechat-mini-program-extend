const gulp = require('gulp');
const ts = require('gulp-typescript');
const del = require('del');
const path = require('path');
const fs = require('fs');

// 创建 TypeScript 项目
const tsProject = ts.createProject('tsconfig.json');

// 源文件路径
const SRC_DIR = 'src';
const DIST_DIR = 'dist';
const TARGET_DIR = '../../client/mp-wechat-client/miniprogram/miniprogram_npm/wechat-mini-program-extend';

// 清理 dist 目录
function clean() {
    return del([DIST_DIR]);
}

// 编译 TypeScript
function compile() {
    const tsResult = tsProject.src()
        .pipe(tsProject())
        .on('error', function(error) {
            console.error('TypeScript 编译错误:', error.message);
            this.emit('end'); // 防止任务崩溃
        });

    return tsResult.js.pipe(gulp.dest(DIST_DIR));
}

// 生成声明文件
function generateTypes() {
    const tsResult = tsProject.src()
        .pipe(tsProject());

    return tsResult.dts.pipe(gulp.dest(DIST_DIR));
}

// 拷贝到目标目录
function copyToTarget() {
    const targetPath = path.resolve(__dirname, TARGET_DIR);

    // 确保目标目录存在
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    return gulp.src(`${DIST_DIR}/**/*`)
        .pipe(gulp.dest(targetPath))
        .on('error', function(error) {
            console.error('拷贝文件失败:', error.message);
            this.emit('end');
        });
}

// 构建任务
const build = gulp.series(clean, compile, generateTypes, copyToTarget);

// 监听任务
function watchFiles() {
    console.log('开始监听 src 目录下的文件变化...');

    // 监听 TypeScript 文件变化
    gulp.watch(`${SRC_DIR}/**/*.ts`, gulp.series(compile, copyToTarget))
        .on('change', function(path) {
            console.log(`文件变更: ${path}`);
        })
        .on('error', function(error) {
            console.error('监听过程中发生错误:', error.message);
            // 继续监听，不中断
        });
}

// 导出任务
exports.clean = clean;
exports.compile = compile;
exports.build = build;
exports.watch = gulp.series(build, watchFiles);
exports.default = build;
