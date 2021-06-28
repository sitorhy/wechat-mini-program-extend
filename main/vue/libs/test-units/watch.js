export default {
    mixins: [
        {
            data: function () {
                return {
                    a: 1,
                    b: 2,
                    c: 3,
                    d: 4,
                    e: {
                        f: {
                            g: 5
                        }
                    },
                    f: [[100, 200], [300, 400]]
                };
            },
            watch: {
                a: function (val, oldVal) {
                    console.log('a new: %s, old: %s', val, oldVal)
                },
                // 方法名
                b: 'someMethod',
                // 该回调会在任何被侦听的对象的 property 改变时被调用，不论其被嵌套多深
                c: {
                    handler: function (val, oldVal) { /* ... */
                        console.log(`c handler = ${oldVal} => ${val}`);
                    },
                    deep: true
                },
                // 该回调将会在侦听开始之后被立即调用
                d: {
                    handler: 'someMethod',
                    immediate: true
                },
                // 你可以传入回调数组，它们会被逐一调用
                e: [
                    'handle1',
                    function handle2(val, oldVal) { /* ... */
                        console.log(`e handle2 = ${oldVal} => ${val}`);
                    },
                    {
                        handler: function handle3(val, oldVal) { /* ... */
                            console.log(`e handle3 = ${oldVal} => ${val}`);
                        },
                        /* ... */
                    }
                ],
                // watch vm.e.f's value: {g: 5}
                'e.f': function (val, oldVal) { /* ... */
                    console.log(`e.f handler = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                },

                // 容错测试
                'e.f.not.exists': {
                    handler: function (val, oldVal) {
                        console.log(`not exists handler = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                },
                '.e.f': {
                    handler: function (val, oldVal) {
                        console.log(`.e.f = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                },
                'e..f': {
                    handler: function (val, oldVal) {
                        console.log(`e..f = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                },
                '': {
                    handler: function (val, oldVal) {
                        console.log(`empty = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                },
                'f.0.1': {
                    handler: function (val, oldVal) {
                        console.log(`f.0 = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                },
                'f.0.0.0.0.0': {
                    handler: function (val, oldVal) {
                        console.log(`f.0.0.0.0.0 = ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
                    },
                    immediate: true
                }
            },
            methods: {
                handler1: function handle3(val, oldVal) { /* ... */
                    console.log(`e handler1 = ${oldVal} => ${val}`);
                },
                someMethod(val) {
                    console.log(`someMethod = ${val}`);
                }
            },
            mounted() {
                console.log('-- mounted --');
                this.a = 114;
                this.b = 514;
                this.c = 1919;
                this.d = 810;
                this.e.f = {
                    g: 114514
                };

                // 报错
                /*
                this.e = {
                    f: 1919810
                };*/
            }
        }
    ]
}