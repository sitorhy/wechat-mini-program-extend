import {PageEx} from "../../libs/mp-extend/index";

PageEx({
    // Page properties 扩展特性，非原生，传值给组件
    properties: {
        word: {
            type: String
        }
    },

    // 自定义数据，不合并到data
    customData: {
        hi: 'MINA'
    },

    /**
     * 页面的初始数据
     */
    data: {
        foods: ['apple', 'orange'],
        a: {
            b: {
                c: 999
            }
        }
    },

    observers: {
        'foods.**': function (val) {
            console.log(`observer of foods ${JSON.stringify(val)}`);
        },
        'a': function (val) {
            console.log(`observer of a ${JSON.stringify(val)}`);
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log(options);

        console.log(this.customData);

        console.log('Page onLoad');

        const exitState = this.exitState;
        this.loadTime = exitState ? exitState.loadTime : new Date().toLocaleString();
        console.log(`loadTime = ${this.loadTime}`);
        this.setData({
            rand: options.rand,
            timeStr: this.loadTime,
            exitStateLoaded: !!exitState,
        });

        this.someMethod();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        console.log('Page onReady');
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        console.log('Page onShow');
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        console.log('Page onHide');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        console.log('Page onUnload');
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        console.log('Page onPullDownRefresh');
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('Page onReachBottom');
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function (e) {
        console.log('Page onShareAppMessage');
        console.log(e);

        return {
            title: '转发',
            query: 'a=1&b=2',
            path: '/mp-checked/index?a=1&b=2'
        };
    },

    onShareTimeline: function (e) {
        console.log('Page onShareTimeline');
        console.log(e);

        return {
            title: '朋友圈',
            query: 'a=1&b=2'
        };
    },

    onAddToFavorites: function (e) {
        console.log('Page onAddToFavorites');
        console.log(e);

        return {
            title: '收藏测试',
            query: 'a=1&b=2',
        }
    },

    onPageScroll(e) {
        console.log('Page onPageScroll');
        console.log(e);
    },

    onResize() {
        console.log('Page onResize');
    },

    someMethod: function () {
        console.log('Page Method Called');

        //  setData 兼容性 , 不触发 a 监听器
        this.setData({
            'a.b.c': 1919
        });

        // 触发 a 监听器
        /*
        this.setData({
            a: {
                b: {
                    c: 1919
                }
            }
        });
        */


        this.setData({
            'foods[1]': 'banana'
        }, () => {
            console.log(this.data.foods.join(','));
        });
    },

    onSaveExitState() {
        return {
            data: {
                loadTime: this.loadTime
            },
            expireTimeStamp: Date.now() + 60 * 1000 // 超时时刻 1分钟
        }
    }
});