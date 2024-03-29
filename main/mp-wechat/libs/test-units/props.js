export default {
    mixins: [
        {
            props: {
                num: {
                    type: Number
                },
                str: {
                    type: String
                },
                bool: {
                    type: Boolean
                },
                obj: {
                    type: Object,
                    default() {
                        return {
                            createTime: Date.now()
                        };
                    }
                },
                arr: {
                    type: Array
                },
                name: {
                    type: String,
                    required: true
                },
                a: {
                    type: Number,
                    default: 100
                },
                b: {
                    type: Number,
                    default: 200
                },
                age: {
                    type: Number,
                    default: 24,
                    validator(value) {
                        return value === 24;
                    }
                },
                d: {
                    type: Number,
                    default() {
                        return this.a * this.b;
                    }
                },
                dd: {
                    type: Number,
                    default() {
                        return this.d * this.d;
                    }
                },
                foods: {
                    type: Array,
                    default() {
                        return ["Orange"];
                    }
                }
            },
            data() {
                return {
                    c: this.a + this.b,
                    e: 114514,
                    f: [{
                        num: 114,
                        obj: {
                            num: 514
                        }
                    }, {
                        num: 1919
                    }],
                    h: {
                        h1: 100,
                        h2: 200
                    },
                    arr2: [100, 200]
                };
            },
            mounted() {
                this.e = 1919810;
                console.log(`e = ${this.e}`);
                this.foods.push("Apple");
                this.$data.e = 1145141919;

                // 修改数组元素
                this.f[0].num = 1919810;
                this.f[0].obj.num = 114514;

                // 动态添加属性
                this.f[0].obj.num2 = {
                    num: 1919
                };

                // 删除测试
                delete this.h.h2;

                // 添加属性
                this.h.h3 = 1919;

                console.log(this.$set(this.h, 'h4', 810));

                this.$delete(this.h, 'h4');

                console.log(this.$props);
                console.log(this.$data);

                this.$set(this.arr2, '4', 666);
                console.log(JSON.stringify(this.arr2));
                this.$delete(this.arr2, '1');
                console.log(this.arr2.length);
                console.log(JSON.stringify(this.arr2));
            }
        }
    ]
}