/**
 * 贪吃蛇测试DEMO
 *
 * 注：
 * 小程序 Canvas BUG（性能极差）：小程序的Canvas会越用越卡，不断触发重绘（60次左右）会引发严重卡顿
 *
 */

/**
 * min <= x < max
 * @param min
 * @param max
 * @returns {*}
 */
function randomNum(min, max) {
    const range = max - min;
    const rand = Math.random();
    return min + Math.floor(rand * range);
}

export default {
    props: {
        size: {
            type: Number,
            default: 15
        },
        width: {
            type: Number,
            default: 300
        },
        height: {
            type: Number,
            default: 300
        },
        backgroundColor: {
            type: String,
            default: '#aeb797'
        },
        color: {
            type: String,
            default: '#000'
        },
        bodyInitLength: {
            type: Number,
            default: 3
        },
        bodyPadding: {
            type: Number,
            default: 2
        },
        speed: {
            type: Number,
            default: 1000
        }
    },
    data() {
        const {width, height, size, bodyInitLength} = this;
        const cx = parseInt(width / size);
        const cy = parseInt(height / size);
        const body = [];
        for (let i = 0; i < bodyInitLength; ++i) {
            body.unshift([parseInt(cx / 2), parseInt(cy / 2) - i]);
        }
        const food = this.nextFood(body);
        return {
            body,
            food,
            direction: [0, -1],
            playing: true,

            mp_canvas_id: 1,
            mp_draw_time: 0 // 强制小程序重建 Canvas 防止卡顿
        };
    },
    computed: {
        backgroundStyle() {
            const {width, height, backgroundColor} = this;
            return `width:${width}px; height:${height}px; background-color:${backgroundColor};`
        }
    },
    mounted() {
        this.storeContext().then(({contexts, canvases}) => {
            this.__contexts = contexts;
            this.__canvases = canvases;
            this.start();
        });
    },
    methods: {
        storeContext() {
            return new Promise(resolve => {
                if (typeof getApp === "undefined") {
                    const context = document.getElementById('canvas').getContext('2d');
                    context.translate(0.5, 0.5);
                    resolve({
                        contexts: [context],
                        canvases: []
                    });
                } else {
                    const canvases = [];
                    const contexts = [];

                    Promise.all(['#canvas', '#canvas2'].map(id => {
                        return new Promise(resolve1 => {
                            wx.createSelectorQuery()
                                .in(this)
                                .select(id)
                                .fields({
                                    node: true,
                                    size: true
                                }).exec(res => {
                                    if (res[0]) {
                                        const canvas = res[0].node;
                                        const ctx = canvas.getContext('2d');
                                        const dpr = wx.getSystemInfoSync().pixelRatio;

                                        canvas.width = res[0].width * dpr;
                                        canvas.height = res[0].height * dpr;
                                        ctx.scale(dpr, dpr);

                                        canvases.push(canvas);
                                        contexts.push(ctx);
                                    }
                                    resolve1();
                                }
                            );
                        });
                    })).then(() => {
                        resolve({
                            contexts,
                            canvases
                        });
                    });
                }
            });
        },

        /**
         * @returns {[CanvasRenderingContext2D]}
         */
        getContexts() {
            return this.__contexts;
        },

        beginPaint(contexts) {
            contexts.forEach(c => c.save());
        },

        endPaint(contexts) {
            contexts.forEach(c => c.restore());
        },

        start() {
            const handler = (finish) => {
                const contexts = this.getContexts();

                this.clean(contexts);
                this.beginPaint(contexts);
                this.drawBackground(contexts);
                this.drawFood(contexts);
                this.nextBody(this.direction[0], this.direction[1], false);
                if (this.checkHitWall()) {
                    this.end('撞墙');
                    return;
                }

                if (this.checkEatSelf()) {
                    this.end('打结');
                    return;
                }

                this.drawBody(contexts);
                this.endPaint(contexts);

                if (this.checkEating()) {
                    this.body.unshift([...this.food]);
                    try {
                        this.food = this.nextFood(this.body);
                    } catch (e) {
                        this.end(e.message);
                    }
                }

                if (typeof finish === "function") {
                    finish();
                }
            };

            let last;
            const step = (timestamp) => {
                const reqAF = window && window.requestAnimationFrame || this.__canvases[0].requestAnimationFrame;

                const requestAnimationFrame = (callback) => {
                    this.reqFlag = reqAF(callback);
                };

                if (!this.playing || !this.getContexts()) {
                    return;
                }
                if (last === undefined) {
                    last = timestamp;
                    requestAnimationFrame(step);
                    return;
                }
                const elapsed = timestamp - last;

                if (elapsed > this.speed) { // 在两秒后停止动画
                    last = timestamp;
                    handler(() => {
                        if (typeof getApp === "undefined") {
                            requestAnimationFrame(step);
                        } else {
                            switch (this.mp_draw_time) {
                                case 40:
                                case 50:
                                case 60:
                                    this.mp_canvas_id = Math.max(1, (this.mp_canvas_id + 1) % 4);
                                    if (this.mp_draw_time === 60) {
                                        this.mp_draw_time = 0;
                                    } else {
                                        this.mp_draw_time++;
                                    }
                                    this.storeContext().then(({contexts, canvases}) => {
                                        this.__contexts = contexts;
                                        this.__canvases = canvases;
                                        requestAnimationFrame(step);
                                    });
                                    break;
                                default: {
                                    this.mp_draw_time++;
                                    requestAnimationFrame(step);
                                }
                            }
                        }
                    });
                } else {
                    requestAnimationFrame(step);
                }
            };

            (window && window.requestAnimationFrame || this.__canvases[0].requestAnimationFrame)(step);
        },

        end(text) {
            const {width, height} = this;
            const fontSize = 48;
            const contexts = this.getContexts();

            this.clean(contexts);

            contexts.forEach(context => {
                context.save();

                context.font = `${fontSize}px serif`;
                context.textAlign = 'center';
                context.fillText(text, width / 2, height / 2);

                context.restore();

                this.playing = false;
            });
        },

        replay() {
            if (!this.playing) {
                const {width, height, size, bodyInitLength} = this;
                const cx = parseInt(width / size);
                const cy = parseInt(height / size);

                const body = [];
                for (let i = 0; i < bodyInitLength; ++i) {
                    body.unshift([parseInt(cx / 2), parseInt(cy / 2) - i]);
                }
                const food = this.nextFood(body);
                this.body = body;
                this.food = food;
                this.direction = [0, -1];

                this.playing = true;
                this.start();
            }
        },

        /**
         * @param deltaX
         * @param deltaY
         * @param allowReset - 允许超出边缘后后重置坐标
         */
        nextBody(deltaX, deltaY, allowReset = true) {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            const nextBody = [];

            for (let i = this.body.length - 1; i > 0; --i) {
                // 相当于 this.body[i][j]=this.body[i-1][j]; 小程序会多次触发setData
                nextBody.unshift([this.body[i - 1][0], this.body[i - 1][1]]);
            }

            let nextX = (this.body[0][0] + deltaX);
            let nextY = (this.body[0][1] + deltaY);

            if (allowReset) {
                if (nextY < 0) {
                    nextY = cy - 1;
                }
                if (nextY >= cy) {
                    nextY = 0;
                }
                if (nextX < 0) {
                    nextX = cx - 1;
                }
                if (nextX >= cy) {
                    nextX = 0;
                }
            }

            nextBody.unshift([nextX, nextY]);

            this.body = nextBody;
        },

        nextFood(body) {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            let x, y;
            for (let i = 0; i < 10; ++i) {
                x = randomNum(0, cx);
                y = randomNum(0, cy);
                if (!body.some(([x1, y1]) => x1 === x && y1 === y)) {
                    return [x, y];
                }
            }

            throw new Error("压力马斯内");
        },

        checkEating() {
            const hx = this.body[0][0];
            const hy = this.body[0][1];
            const x = this.food[0];
            const y = this.food[1];
            if ([
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ].some(([fx, fy]) => fx === hx && fy === hy)) {
                return true;
            }
            return false;
        },

        /**
         * 检查撞墙
         */
        checkHitWall() {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            const hx = this.body[0][0];
            const hy = this.body[0][1];

            if (hx < 0 || hx >= cx || hy < 0 || hy >= cy) {
                return true;
            }
            return false;
        },

        /**
         * 检查打结
         */
        checkEatSelf() {
            const hx = this.body[0][0];
            const hy = this.body[0][1];

            for (let i = 1; i < this.body.length; ++i) {
                if (this.body[i][0] === hx && this.body[i][1] === hy) {
                    return true;
                }
            }
            return false;
        },


        /**
         * @param {[CanvasRenderingContext2D]} contexts
         */
        clean(contexts) {
            contexts.forEach(context => {
                const {width, height} = this;
                context.clearRect(0, 0, width, height);
            });
        },

        /**
         * @param {[CanvasRenderingContext2D]} contexts
         */
        drawBody(contexts) {
            contexts.forEach(context => {
                context.save();
                const {size, bodyPadding} = this;

                this.body.forEach(([x, y]) => {
                    context.fillRect(
                        x * size + bodyPadding,
                        y * size + bodyPadding,
                        size - bodyPadding * 2,
                        size - bodyPadding * 2
                    );
                });
                context.restore();
            });
        },

        /**
         * @param {[CanvasRenderingContext2D]} contexts
         */
        drawFood(contexts) {
            contexts.forEach(context => {
                context.save();
                const {size, bodyPadding} = this;
                context.fillStyle = '#FF0000';
                context.fillRect(
                    this.food[0] * size + bodyPadding,
                    this.food[1] * size + bodyPadding,
                    size - bodyPadding * 2,
                    size - bodyPadding * 2
                );
                context.restore();
            });
        },

        /**
         * @param {[CanvasRenderingContext2D]} contexts
         */
        drawBackground(contexts) {
            contexts.forEach(context => {
                context.save();
                const {width, height, size} = this;
                const cx = parseInt(width / size);
                const cy = parseInt(height / size);

                context.strokeStyle = this.color;
                context.lineWidth = 1;
                for (let i = 1; i < cx; ++i) {
                    context.moveTo(i * size, 0);
                    context.lineTo(i * size, height);
                    context.stroke();
                }
                for (let i = 1; i < cy; ++i) {
                    context.moveTo(0, i * size);
                    context.lineTo(width, i * size);
                    context.stroke();
                }
                context.strokeRect(0, 0, width, height);
                context.restore();
            });
        },

        /**
         * 检查转向是否与自身冲突
         * @param deltaX
         * @param deltaY
         * @returns {boolean}
         */
        validateDirection(deltaX, deltaY) {
            const nextX = this.body[0][0] + deltaX;
            const nextY = this.body[0][1] + deltaY;
            if (this.body.some(([x, y]) => x === nextX && y === nextY)) {
                return false;
            }
            return true;
        },
        onUp() {
            if (this.validateDirection(0, -1)) {
                this.direction = [0, -1];
            }
        },
        onDown() {
            if (this.validateDirection(0, 1)) {
                this.direction = [0, 1];
            }
        },
        onLeft() {
            if (this.validateDirection(-1, 0)) {
                this.direction = [-1, 0];
            }
        },
        onRight() {
            if (this.validateDirection(1, 0)) {
                this.direction = [1, 0];
            }
        },

        stop() {
            (
                window && window.cancelAnimationFrame || this.__canvases[0].cancelAnimationFrame
            )(this.reqFlag);
        }
    },
    destroyed() {
        this.stop();
        this.__contexts = null;
        this.__canvases = null;
    }
};