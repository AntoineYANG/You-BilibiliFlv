/*
 * @Author: Kanata You 
 * @Date: 2020-09-08 01:41:51 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-09-09 03:20:32
 */

import React from "react";
import $ from "jquery";
import flvjs from "flv.js";
import ResponsiveComponent from "you-responsivecomponent";


export const isFullScreen = (): boolean => {
    return (
        document.fullscreenElement && true
    ) || (
        document.body.scrollHeight === window.screen.height
        && document.body.scrollWidth === window.screen.width
    );
}

export interface BilibiliFlvProps {
    /** 视频是否在加载完成后自动播放 */
    autoPlay?: boolean;
    /** 组件所使用的初始控件栏外观替换件 */
    control?: BilibiliFlvControlAppearance;
    /** 播放结束的动作 */
    onPlayEnd?: (video: HTMLVideoElement) => void;
    /** 视频类型 */
    type: "flv" | "mp4";
    /** 视频资源地址 */
    url: string;
    /** 最大日志记录长度 */
    maxLogLength?: number;
};

export interface BilibiliFlvState {
    /** 组件所使用的当前控件栏外观替换件 */
    control: BilibiliFlvControlAppearance;
    /** 视频的播放状态 */
    state: "playing" | "paused";
    /** 视频音量，0-1 */
    volume: number;
    /**
     * 视频播放速度 id
     * - 0: 0.5
     * - 1: 1
     * - 2: 1.5
     * - 3: 2
     */
    speedId: number;
    /** 视频是否静音 */
    muted: boolean;
    /** 视频总长度（秒） */
    duration: number;
    /** 视频已缓冲长度（秒） */
    buffered: number;
    /** 视频当前播放位置（秒） */
    curTime: number;
    /** 播放器内宽（像素） */
    w: number;
};

/**
 * 基于 bilibili/flv.js 制作的组件.
 *
 * @export
 * @class BilibiliFlv
 * @extends {ResponsiveComponent<BilibiliFlvProps, BilibiliFlvState>}
 */
export class BilibiliFlv extends ResponsiveComponent<BilibiliFlvProps, BilibiliFlvState> {
    
    // 类属性

    /**
     * 播放器的播放速度选项列表.
     * - 0: 0.5
     * - 1: 1
     * - 2: 1.5
     * - 3: 2
     *
     * @static
     * @type {Array<number>}
     * @memberof BilibiliFlv
     */
    public static readonly PLAYBACKRATE: Array<number> = [0.5, 1, 1.5, 2];


    // 对象属性：引用和上下文

    /**
     * 原生播放器元素的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLVideoElement>}
     * @memberof BilibiliFlv
     */
    protected dom: React.RefObject<HTMLVideoElement>;

    /**
     * 控件组容器元素的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLDivElement>}
     * @memberof BilibiliFlv
     */
    protected control: React.RefObject<HTMLDivElement>;

    /**
     * 控件：表示进度条背景的元素的引用.
     *
     * @protected
     * @type {React.RefObject<SVGRectElement>}
     * @memberof BilibiliFlv
     */
    protected progBase: React.RefObject<SVGRectElement>;

    /**
     * 控件：表示缓冲进度的元素的引用.
     *
     * @protected
     * @type {React.RefObject<SVGRectElement>}
     * @memberof BilibiliFlv
     */
    protected progBuffer: React.RefObject<SVGRectElement>;

    /**
     * 控件：表示播放进度的元素的引用.
     *
     * @protected
     * @type {React.RefObject<SVGRectElement>}
     * @memberof BilibiliFlv
     */
    protected progCurrent: React.RefObject<SVGRectElement>;

    /**
     * 控件：表示进度图标的元素容器（G）的引用.
     *
     * @protected
     * @type {React.RefObject<SVGGElement>}
     * @memberof BilibiliFlv
     */
    protected progFlag: React.RefObject<SVGGElement>;

    /**
     * 控件：时间轴预览的元素容器（div）的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLDivElement>}
     * @memberof BilibiliFlv
     */
    protected timetip: React.RefObject<HTMLDivElement>;

    /**
     * 控件：播放速度设置框的元素容器（div）的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLDivElement>}
     * @memberof BilibiliFlv
     */
    protected speedmenu: React.RefObject<HTMLDivElement>;

    /**
     * 控件：额外绘制内容的画布元素（canvas）的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLCanvasElement>}
     * @memberof BilibiliFlv
     */
    protected canvas: React.RefObject<HTMLCanvasElement>;

    /**
     * 绘制上下文：额外绘制内容的画布元素（canvas）的绘制上下文.
     *
     * @protected
     * @type {CanvasRenderingContext2D | null}
     * @memberof BilibiliFlv
     */
    protected ctx: CanvasRenderingContext2D | null;


    // 对象属性：外观设置

    /**
     * 控件栏外观.
     *
     * @protected
     * @type {BilibiliFlvControlInterface}
     * @memberof BilibiliFlv
     */
    protected controller: BilibiliFlvControlInterface;

    
    // 对象属性：绘制时属性

    /**
     * 进度条显示宽度（像素）.
     *
     * @private
     * @type {number}
     * @memberof BilibiliFlv
     */
    private progW: number;

    /**
     * 缩放比例（以1为基准）.
     *
     * @private
     * @type {number}
     * @memberof BilibiliFlv
     */
    private scaling: number;

    /**
     * 预览时间位置（秒）.
     * 
     * 若未处于时间轴预览交互，该值为 null.
     *
     * @private
     * @type {(number | null)}
     * @memberof BilibiliFlv
     */
    private focus: number | null;

    /**
     * 播放器元素的拷贝，不接受任何交互，用于呈现目标时间的预览.
     *
     * @private
     * @type {HTMLVideoElement}
     * @memberof BilibiliFlv
     * 
     * @summary 你可以在定义控件外观
     * （BilibiliFlvControlInterface | BilibiliFlvControlAppearance）时使用它：
     * @example
     *  {
     *      getSnapshot: (time: number, o: HTMLVideoElement) => {
     *          const randomId: string = (Math.random() * 1e6).toFixed(0);
     *
     *          setTimeout(() => {
     *              $(`#${ randomId }`).append(o);
     *          }, 20);
     *
     *          return (
     *              <div style={{
     *                  width: "16vmin",
     *                  backgroundColor: "rgb(30,30,30)",
     *                  padding: "4px"
     *              }} >
     *                  <div id={ randomId }
     *                  style={{
     *                      display: "block"
     *                  }} />
     *                  <label
     *                  style={{
     *                      display: "block",
     *                      fontSize: "12px"
     *                  }} >
     *                      { BilibiliFlv.toTimeString(time) }
     *                  </label>
     *              </div>
     *          );
     *      }
     *  }
     */
    private copy: HTMLVideoElement;

    /**
     * 当前视频的资源加载状况.
     *
     * @protected
     * @type {VideoState}
     * @memberof BilibiliFlv
     */
    protected videoState: VideoState;


    // 对象属性：定时器
    
    /**
     * 延时器：用于管理控件组元素的淡出动作.
     *
     * @private
     * @type {NodeJS.Timeout}
     * @memberof BilibiliFlv
     */
    private timer: NodeJS.Timeout;

    /**
     * 循环器：用于周期调用关联接口进行画布绘制.
     *
     * @private
     * @type {NodeJS.Timeout}
     * @memberof BilibiliFlv
     */
    private timerCanvas: NodeJS.Timeout;


    // 对象属性：交互时属性

    /**
     * 交互锁：用于防止 keyPress 事件重复触发.
     *
     * @private
     * @type {boolean}
     * @memberof BilibiliFlv
     */
    private keyDownLock: boolean;

    /**
     * 当前进度图标是否处于拖动状态.
     *
     * @private
     * @type {boolean}
     * @memberof BilibiliFlv
     */
    private dragging: boolean;

    /**
     * 当前视频交互手势.
     * 
     * - 若没有手势交互在进行中，该值为 null.
     * - 若手势交互仍在判断阶段，该值为 "unknown".
     * - "lightness" 为保留入口，暂无对应交互.
     *
     * @private
     * @type {(null | "unknown" | "dragging" | "volume" | "lightness")}
     * @memberof BilibiliFlv
     */
    private gesture: null | "unknown" | "dragging" | "volume" | "lightness";


    // 对象属性：交互管理信息

    /**
     * 组件的日志记录.
     *
     * @protected
     * @type {Array<BilibiliFlvEventLog>}
     * @memberof BilibiliFlv
     */
    protected logs: Array<BilibiliFlvEventLog>;

    /**
     * 最大日志记录长度.
     *
     * @protected
     * @type {number}
     * @memberof BilibiliFlv
     */
    protected maxLogLength: number;


    
    // 静态工具方法
    
    /**
     * 以 "mm:ss" 的格式转化生成时间字符串.
     *
     * @static
     * @param {number} sec 时间（秒）
     * @returns {string}
     * @memberof BilibiliFlv
     */
    public static toTimeString(sec: number): string {
        const minutes: number = Math.floor(sec / 60);
        const seconds: number = Math.floor(sec % 60);

        return `${
            minutes.toString().padStart(2, "0")
        }:${
            seconds.toString().padStart(2, "0")
        }`;
    }


    // 生命周期

    public constructor(props: BilibiliFlvProps) {
        // 组件初始化
        super(props);
        this.state = {
            control: this.props.control || BilibiliFlvControlDefault,
            state: this.props.autoPlay ? "playing" : "paused",
            duration: 0,
            buffered: 0,
            curTime: 0,
            volume: 0.4,
            muted: false,
            speedId: 1,
            w: 0
        };

        // 构造引用，初始化上下文
        this.dom = React.createRef<HTMLVideoElement>();
        this.control = React.createRef<HTMLDivElement>();
        this.progBase = React.createRef<SVGRectElement>();
        this.progBuffer = React.createRef<SVGRectElement>();
        this.progCurrent = React.createRef<SVGRectElement>();
        this.progFlag = React.createRef<SVGGElement>();
        this.timetip = React.createRef<HTMLDivElement>();
        this.speedmenu = React.createRef<HTMLDivElement>();
        this.canvas = React.createRef<HTMLCanvasElement>();
        this.ctx = null;

        // 初始化控件组外观
        this.controller = this.loadController();

        // 初始化绘制时字段，创建用于展示预览的拷贝
        this.progW = 100;
        this.scaling = 1;
        this.focus = null;
        this.copy = document.createElement("video");
        this.copy.style.width = "100%";
        this.copy.style.height = "100%";
        this.videoState = "HAVE_NOTHING";

        // 初始化定时器
        this.timer = setTimeout(() => void 0, 0);
        this.timerCanvas = setInterval(() => {
            this.handleCanvasRender();
        }, 62);
        
        // 初始化交互时字段
        this.keyDownLock = false;
        this.dragging = false;
        this.gesture = null;

        // 初始化交互记录
        this.logs = [];
        this.maxLogLength = this.props.maxLogLength || 20;
    }

    public render(): JSX.Element {
        // 更新缩放比例
        this.scaling = Math.pow(this.state.w / 1200, 0.3);

        return (
            // 最外层容器，同时也是全屏显示的作用对象
            <div
            onMouseMove={
                () => {
                    // 淡入显示控件组
                    this.showController("fadein");
                }
            }
            onKeyPress={
                e => {
                    if (this.handleKeyPress(e.which)) {
                        // 响应交互后，阻止默认事件
                        e.preventDefault();
                    }
                    // 阻止冒泡
                    e.stopPropagation();
                }
            }
            onKeyDown={
                e => {
                    if (this.handleKeyDown(e.which)) {
                        // 响应交互后，阻止默认事件
                        e.preventDefault();
                    }
                    // 阻止冒泡
                    e.stopPropagation();
                }
            }
            onKeyUp={
                () => {
                    // 关闭交互锁
                    this.keyDownLock = false;
                }
            }
            style={{
                overflow: "hidden"  // 这个元素的高度将会实时计算，
                                    // 设置隐藏超出部分以防止交互引起下方元素发生偏移
            }} >
                {/* 原生播放器 */}
                <video key="video" ref={ this.dom } autoPlay={ this.props.autoPlay }
                style={{
                    display: "block",   // 填充父元素
                    width: "100%"       // 高度自动等比例调整
                }}
                onMouseOver={
                    () => {
                        // 让元素获得焦点，以便于其父结点监听键盘交互和阻止默认键盘事件
                        $(this.dom.current!).focus();
                    }
                }
                onMouseDown={
                    (ev: React.MouseEvent) => {
                        // 可能将开始新的手势交互，进入判断阶段
                        this.gesture = "unknown";

                        /** 交互起始位置 x 坐标 */
                        const x0: number = ev.clientX;
                        /** 交互起始位置 y 坐标 */
                        const y0: number = ev.clientY;
                        
                        /** 窗口内宽度 */
                        const W: number = window.innerWidth;
                        /** 播放器高度 */
                        const H: number = (
                            this.dom.current?.clientHeight
                        ) || (
                            window.innerHeight / 2
                        );

                        /** 交互操作对应目标的原始值 */
                        let value0: number = 0;
                        
                        /** 临时 mouseMove 监听 */
                        const mouseMoveListener = (e: MouseEvent) => {
                            /** 当前 x 坐标 */
                            const x: number = e.clientX;
                            /** 当前 y 坐标 */
                            const y: number = e.clientY;

                            if (this.gesture === "unknown") {
                                // 判断一个未识别的手势操作

                                /** x 方向位移 */
                                const dmx: number = Math.abs(x - x0);
                                /** y 方向位移 */
                                const dmy: number = Math.abs(y - y0);

                                if (dmx + dmy >= W / 60 + 10) {
                                    // 位移的曼哈顿距离大于一定值，本次手势操作有效，开始识别

                                    // 显示控件组
                                    this.showController("show-nofadeout");
                                    
                                    if (dmx > dmy) {
                                        // 水平方向位移较大，识别为时间轴拖拽交互
                                        this.gesture = "dragging";
                                        
                                        // 记录当前播放位置
                                        value0 = this.dom.current!.currentTime;

                                        // 输出到日志
                                        this.writeLog({
                                            type: "relocate",
                                            prev: value0,
                                            next: value0
                                        });
                                    } else if (x0 >= W / 2) {
                                        // 从屏幕右侧开始且垂直方向位移较大，识别为音量调整交互
                                        this.gesture = "volume";

                                        // 记录当前音量
                                        value0 = this.dom.current!.volume;

                                        // 输出到日志
                                        this.writeLog({
                                            type: "setVolume",
                                            prev: value0,
                                            next: value0
                                        });
                                    } else {
                                        // 从屏幕左侧开始且垂直方向位移较大，识别为保留交互 "lightness"
                                        this.gesture = "lightness";

                                        // 没有实际意义的初始化
                                        value0 = 1;
                                    }
                                }
                            } else {
                                // 已识别手势
                                switch (this.gesture) {

                                    case "dragging":
                                        // 移动时间轴

                                        /** 目标位置（秒） */
                                        const time: number = Math.max(
                                            0, Math.min(
                                                (this.dom.current?.duration || 1) - 0.1,
                                                value0 + (
                                                    x - x0
                                                ) / W * (
                                                    this.dom.current?.duration || 1
                                                )
                                            )
                                        );

                                        if (this.dom.current) {
                                            // 设置播放时间
                                            this.dom.current.currentTime = time;

                                            // 更新日志
                                            this.writeLog({
                                                type: "relocate",
                                                prev: (
                                                    this.logs.length && this.logs[
                                                        this.logs.length - 1
                                                    ].type === "relocate"
                                                ) ? this.logs[
                                                    this.logs.length - 1
                                                ].prev: this.dom.current.currentTime,
                                                next: this.dom.current.currentTime
                                            });

                                            // 更新状态
                                            this.setState({
                                                curTime: this.dom.current.currentTime
                                            });
                                        }

                                        break;

                                    case "volume":
                                        // 调整音量
                                        
                                        /** 目标音量 */
                                        const v: number = Math.max(
                                            0, Math.min(
                                                1,
                                                value0 + (
                                                    y0 - y
                                                ) / H / 2
                                            )
                                        );

                                        if (this.dom.current) {
                                            // 仅在解除静音或音量变化时触发更新
                                            if (
                                                this.dom.current.muted
                                                || this.dom.current.volume !== v
                                            ) {
                                                if (this.dom.current.muted) {
                                                    // 解除静音
                                                    this.dom.current.muted = false;

                                                    this.writeLog({
                                                        type: "unmute",
                                                        prev: 1,
                                                        next: 0
                                                    });
                                                }

                                                // 设置音量
                                                this.dom.current.volume = v;

                                                // 更新日志
                                                this.writeLog({
                                                    type: "setVolume",
                                                    prev: (
                                                        this.logs.length && this.logs[
                                                            this.logs.length - 1
                                                        ].type === "setVolume"
                                                    ) ? this.logs[
                                                        this.logs.length - 1
                                                    ].prev: this.dom.current.volume,
                                                    next: this.dom.current.volume
                                                });

                                                // 更新状态
                                                this.setState({
                                                    muted: false,
                                                    volume: this.dom.current.volume
                                                });
                                            }
                                        }

                                        break;

                                    case "lightness":
                                        break;
                                }
                            }
                        };

                        /** 临时 mouseUp 监听 */
                        const mouseUpListener = () => {
                            // 短暂延迟后重置手势
                            setTimeout(() => {
                                this.gesture = null;
                            }, 10);

                            // 显示控件组
                            this.showController("show");
                            
                            // 卸载临时监听
                            document.body.removeEventListener(
                                "mousemove", mouseMoveListener
                            );
                            document.body.removeEventListener(
                                "mouseup", mouseUpListener
                            );
                        };

                        // 全局绑定临时监听
                        document.body.addEventListener(
                            "mousemove", mouseMoveListener
                        );
                        document.body.addEventListener(
                            "mouseup", mouseUpListener
                        );
                    }
                }
                onTouchMove={
                    (ev: React.TouchEvent) => {
                        if (!this.gesture && ev.touches.length) {
                            // 为了兼容 touchStart 不能正确触发的情况，以此状态代替

                            // 可能将开始新的手势交互，进入判断阶段
                            this.gesture = "unknown";

                            /** 交互起始位置 x 坐标 */
                            const x0: number = ev.touches[0].clientX;
                            /** 交互起始位置 y 坐标 */
                            const y0: number = ev.touches[0].clientY;
                            
                            /** 窗口内宽度 */
                            const W: number = window.innerWidth;
                            /** 播放器高度 */
                            const H: number = (
                                this.dom.current?.clientHeight
                            ) || (
                                window.innerHeight / 2
                            );
                                    
                            /** 交互操作对应目标的原始值 */
                            let value0: number = 0;

                            /** 临时 touchMove 监听 */
                            const touchMoveListener = (e: TouchEvent) => {
                                if (e.touches.length) {
                                    /** 当前 x 坐标 */
                                    const x: number = e.touches[0].clientX;
                                    /** 当前 y 坐标 */
                                    const y: number = e.touches[0].clientY;

                                    if (this.gesture === "unknown") {
                                        // 判断一个未识别的手势操作

                                        /** x 方向位移 */
                                        const dmx: number = Math.abs(x - x0);
                                        /** y 方向位移 */
                                        const dmy: number = Math.abs(y - y0);

                                        if (dmx + dmy >= W / 60 + 10) {
                                            // 位移的曼哈顿距离大于一定值，本次手势操作有效，开始识别

                                            // 显示控件组
                                            this.showController("show-nofadeout");
                                            
                                            if (dmx > dmy) {
                                                // 水平方向位移较大，识别为时间轴拖拽交互
                                                this.gesture = "dragging";
                                                
                                                // 记录当前播放位置
                                                value0 = this.dom.current!.currentTime;

                                                // 输出到日志
                                                this.writeLog({
                                                    type: "relocate",
                                                    prev: value0,
                                                    next: value0
                                                });
                                            } else if (x0 >= W / 2) {
                                                // 从屏幕右侧开始且垂直方向位移较大，识别为音量调整交互
                                                this.gesture = "volume";

                                                // 记录当前音量
                                                value0 = this.dom.current!.volume;

                                                // 输出到日志
                                                this.writeLog({
                                                    type: "setVolume",
                                                    prev: value0,
                                                    next: value0
                                                });
                                            } else {
                                                // 从屏幕左侧开始且垂直方向位移较大，识别为保留交互 "lightness"
                                                this.gesture = "lightness";

                                                // 没有实际意义的初始化
                                                value0 = 1;
                                            }
                                        }
                                    } else {
                                        // 已识别手势
                                        switch (this.gesture) {

                                            case "dragging":
                                                // 移动时间轴

                                                /** 目标位置（秒） */
                                                const time: number = Math.max(
                                                    0, Math.min(
                                                        (this.dom.current?.duration || 1) - 0.1,
                                                        value0 + (
                                                            x - x0
                                                        ) / W * (
                                                            this.dom.current?.duration || 1
                                                        )
                                                    )
                                                );

                                                if (this.dom.current) {
                                                    // 设置播放时间
                                                    this.dom.current.currentTime = time;

                                                    // 更新日志
                                                    this.writeLog({
                                                        type: "relocate",
                                                        prev: (
                                                            this.logs.length && this.logs[
                                                                this.logs.length - 1
                                                            ].type === "relocate"
                                                        ) ? this.logs[
                                                            this.logs.length - 1
                                                        ].prev: this.dom.current.currentTime,
                                                        next: this.dom.current.currentTime
                                                    });

                                                    // 更新状态
                                                    this.setState({
                                                        curTime: this.dom.current.currentTime
                                                    });
                                                }

                                                break;

                                            case "volume":
                                                // 调整音量
                                                
                                                /** 目标音量 */
                                                const v: number = Math.max(
                                                    0, Math.min(
                                                        1,
                                                        value0 + (
                                                            y0 - y
                                                        ) / H / 2
                                                    )
                                                );

                                                if (this.dom.current) {
                                                    // 仅在解除静音或音量变化时触发更新
                                                    if (
                                                        this.dom.current.muted
                                                        || this.dom.current.volume !== v
                                                    ) {
                                                        if (this.dom.current.muted) {
                                                            // 解除静音
                                                            this.dom.current.muted = false;

                                                            this.writeLog({
                                                                type: "setVolume",
                                                                prev: (
                                                                    this.logs.length && this.logs[
                                                                        this.logs.length - 1
                                                                    ].type === "setVolume"
                                                                ) ? this.logs[
                                                                    this.logs.length - 1
                                                                ].prev: this.dom.current.volume,
                                                                next: this.dom.current.volume
                                                            });
                                                        }

                                                        // 设置音量
                                                        this.dom.current.volume = v;

                                                        // 更新日志
                                                        this.writeLog({
                                                            type: "setVolume",
                                                            prev: (
                                                                this.logs.length && this.logs[
                                                                    this.logs.length - 1
                                                                ].type === "setVolume"
                                                            ) ? this.logs[
                                                                this.logs.length - 1
                                                            ].prev: this.dom.current.volume,
                                                            next: this.dom.current.volume
                                                        });

                                                        // 更新状态
                                                        this.setState({
                                                            muted: false,
                                                            volume: this.dom.current.volume
                                                        });
                                                    }
                                                }

                                                break;

                                            case "lightness":
                                                break;
                                        }
                                    }
                                }
                            };

                            /** 临时 touchEnd & touchCancel 监听 */
                            const touchEndListener = () => {
                                // 短暂延迟后重置手势
                                setTimeout(() => {
                                    this.gesture = null;
                                }, 10);

                                // 显示控件组
                                this.showController("show");
                                
                                // 卸载临时监听
                                document.body.removeEventListener(
                                    "touchmove", touchMoveListener
                                );
                                document.body.removeEventListener(
                                    "touchend", touchEndListener
                                );
                                document.body.removeEventListener(
                                    "touchcancel", touchEndListener
                                );
                            };

                            // 全局绑定临时监听
                            document.body.addEventListener(
                                "touchmove", touchMoveListener
                            );
                            document.body.addEventListener(
                                "touchend", touchEndListener
                            );
                            document.body.addEventListener(
                                "touchcancel", touchEndListener
                            );
                        }
                    }
                }
                onContextMenu={
                    e => {
                        // 禁止默认右键菜单
                        e.preventDefault();
                    }
                }
                onDoubleClick={
                    () => {
                        // 播放 / 暂停
                        this.playOrPause();
                    }
                }
                onCanPlay={
                    () => {
                        // 更新资源状态
                        this.videoState = parseVideoState((
                            this.dom.current?.readyState || 0
                        ) as 0 | 1 | 2 | 3 | 4);
                        
                        // 更新视频信息
                        this.setState({
                            duration: this.dom.current!.duration,
                            buffered: this.dom.current!.buffered.end(0),
                            curTime: this.dom.current!.currentTime,
                            volume: this.dom.current!.volume,
                            muted: this.dom.current!.muted
                        });
                    }
                }
                onTimeUpdate={
                    () => {
                        // 更新资源状态
                        this.videoState = parseVideoState((
                            this.dom.current?.readyState || 0
                        ) as 0 | 1 | 2 | 3 | 4);

                        if (this.dom.current!.currentTime === this.dom.current!.duration) {
                            // 播完动作
                            (this.props.onPlayEnd || (() => {
                                // 默认动作：暂停视频并跳转到起点位置
                                this.dom.current!.pause();
                                this.dom.current!.currentTime = 0;
                                
                                // 显示控件组
                                this.showController("show");

                                // 更新播放状态
                                this.setState({
                                    state: "paused",
                                    curTime: 0
                                });
                            }))(this.dom.current!);
                        } else {
                            // 更新播放状态
                            this.setState({
                                duration: this.dom.current!.duration,
                                buffered: this.dom.current!.buffered.end(0),
                                curTime: this.dom.current!.currentTime
                            });
                        }
                    }
                } >
                    Please update your browser to enable HTML5 video.
                </video>
                {/* 播放动画的canvas */}
                <canvas key="canvas" ref={ this.canvas }
                style={{
                    pointerEvents: "none",  // 阻止任何交互
                    position: "absolute",   // 加载完成和窗口缩放时会自动计算新的位置和宽高
                    display: "none"
                }} />
                {/* 组件栏 */}
                <div key="control" ref={ this.control }
                style={{
                    width: `${ this.state.w - 10 }px`,
                    background: this.controller.background,
                    height: `${ 36 * this.scaling }px`,
                    padding: "0 6px",
                    position: "relative",
                    top: `-${ 36 * this.scaling }px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: `-${ 36 * this.scaling }px`
                }}
                onMouseOver={
                    () => {
                        // 淡入
                        this.showController("fadein-nofadeout");
                    }
                }
                onMouseOut={
                    () => {
                        // 淡出
                        this.showController("show");
                    }
                }
                onMouseMove={
                    e => {
                        // 阻止冒泡
                        e.stopPropagation();
                        
                        // 淡入
                        this.showController("fadein-nofadeout");
                    }
                } >
                    {/* 播放/暂停按钮 */}
                    <svg key="play" viewBox="0 0 36 36"
                    style={{
                        width: `${ 36 * this.scaling }px`,
                        height: `${ 36 * this.scaling }px`
                    }} >
                        { this.state.state === "playing" ? (
                            // 暂停按钮
                            this.controller.btnStop.map((d, i) => {
                                return {
                                    ...d,
                                    props: i ? {
                                        ...d.props,
                                        style: {
                                            ...d.props.style,
                                            pointerEvents: "none"
                                        }
                                    } : {
                                        onClick: () => this.pause(),
                                        ...d.props
                                    },
                                    key: i
                                };
                            })
                        ) : (
                            // 播放按钮
                            this.controller.btnPlay.map((d, i) => {
                                return {
                                    ...d,
                                    props: i ? {
                                        ...d.props,
                                        style: {
                                            ...d.props.style,
                                            pointerEvents: "none"
                                        }
                                    } : {
                                        onClick: () => this.play(),
                                        ...d.props
                                    },
                                    key: i
                                };
                            })
                        ) }
                    </svg>
                    {/* 当前时间 */}
                    <label key="curTime" style={{
                        display: "inline-block",
                        fontSize: `${ 12 * Math.sqrt(this.scaling) }px`,
                        width: `${ 48 * this.scaling }px`,
                        maxHeight: `${ 36 * this.scaling }px`,
                        color: this.controller.color
                    }} >
                        { BilibiliFlv.toTimeString(this.state.curTime) }
                    </label>
                    {/* 进度条 */}
                    <svg key="progress"
                    style={{
                        height: `${ 36 * this.scaling }px`,
                        flex: 1     // 自动拉伸适应宽度
                    }} >
                    {/* 背景 */}
                    {
                        {
                            ...this.controller.progressBase,
                            props: {
                                ...this.scaleY(this.controller.progressBase.props),
                                onMouseOver: (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
                                    const x: number = e.clientX - (
                                        $(e.currentTarget).offset()?.left || 0
                                    );
                                    const time: number = this.state.duration / (
                                        $(e.currentTarget).width()!
                                    ) * x;
                                    this.focus = time;
                                    this.forceUpdate();
                                    if (!this.timetip.current) {
                                        return;
                                    }
                                    this.timetip.current.style.top = `${
                                        ($(e.currentTarget).offset()?.top || 0) - (
                                            $(window).scrollTop() || 0
                                        )
                                    }px`;
                                    this.timetip.current.style.left = `${
                                        e.clientX
                                    }px`;
                                },
                                onMouseMove: (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
                                    const x: number = e.clientX - (
                                        $(e.currentTarget).offset()?.left || 0
                                    );
                                    const time: number = this.state.duration / (
                                        $(e.currentTarget).width()!
                                    ) * x;
                                    this.focus = time;
                                    this.forceUpdate();
                                    if (!this.timetip.current) {
                                        return;
                                    }
                                    this.timetip.current.style.top = `${
                                        ($(e.currentTarget).offset()?.top || 0) - (
                                            $(window).scrollTop() || 0
                                        )
                                    }px`;
                                    this.timetip.current.style.left = `${
                                        e.clientX
                                    }px`;
                                },
                                onMouseOut: () => {
                                    this.focus = null;
                                    this.forceUpdate();
                                },
                                onClick: (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
                                    if (!this.dom.current) {
                                        return;
                                    }
                                    
                                    const x: number = e.clientX - (
                                        $(e.currentTarget).offset()?.left || 0
                                    );
                                    const time: number = this.state.duration / (
                                        $(e.currentTarget).width()!
                                    ) * x;
                                    this.dom.current.currentTime = time;
                                    this.setState({
                                        curTime: time
                                    });
                                },
                                x: 20 * this.scaling
                            },
                            key: "base",
                            ref: this.progBase
                        }
                    }
                    {/* 已缓冲 */}
                    {
                        {
                            ...this.controller.progressBuffer,
                            props: {
                                ...this.scaleY(this.controller.progressBuffer.props),
                                style: {
                                    ...this.controller.progressBuffer.props.style,
                                    pointerEvents: "none"
                                },
                                x: 20 * this.scaling
                            },
                            key: "buffer",
                            ref: this.progBuffer
                        }
                    }
                    {/* 当前进度 */}
                    {
                        {
                            ...this.controller.progressCurrent,
                            props: {
                                ...this.scaleY(this.controller.progressCurrent.props),
                                style: {
                                    ...this.controller.progressCurrent.props.style,
                                    pointerEvents: "none"
                                },
                                x: 20 * this.scaling
                            },
                            key: "current",
                            ref: this.progCurrent
                        }
                    }
                    {/* 图标 */}
                    {
                        {
                            ...this.controller.progressFlag,
                            props: {
                                ...this.scaleY(this.controller.progressFlag.props),
                                style: {
                                    ...this.controller.progressFlag.props.style,
                                    transform: `translate(-100vw, 50%)`
                                },
                                onMouseDown: (
                                    () => {
                                        this.dragging = true;

                                        const target: SVGRectElement = this.progBase.current!;
                                        const w: number = this.progW;
                                        const offset: number = (
                                            $(target).offset()?.left || 0
                                        );

                                        const k = setInterval(
                                            () => {
                                                this.showController("show-nofadeout");
                                            }, 1000
                                        );

                                        if (this.dom.current?.paused === false) {
                                            this.writeLog({
                                                type: "pause",
                                                prev: 0,
                                                next: 1
                                            });
                                        }

                                        this.writeLog({
                                            type: "relocate",
                                            prev: this.dom.current!.currentTime,
                                            next: this.dom.current!.currentTime
                                        });
                                        
                                        const mouseMoveListener = (e: MouseEvent) => {
                                            const x: number = e.clientX - offset;
                                            const time: number = Math.max(
                                                0, Math.min(
                                                    this.dom.current?.duration || 1,
                                                    this.state.duration / w * x
                                                )
                                            );
                                            if (this.dom.current) {
                                                this.dom.current.pause();
                                                this.dom.current.currentTime = time;

                                                this.writeLog({
                                                    type: "relocate",
                                                    prev: (
                                                        this.logs.length && this.logs[
                                                            this.logs.length - 1
                                                        ].type === "relocate"
                                                    ) ? this.logs[
                                                        this.logs.length - 1
                                                    ].prev: this.dom.current.currentTime,
                                                    next: this.dom.current.currentTime
                                                });
                                            }
                                            this.setState({
                                                state: "paused",
                                                curTime: this.dom.current?.currentTime || time
                                            });
                                        };
            
                                        const mouseUpListener = () => {
                                            this.dragging = false;
                                            document.body.removeEventListener(
                                                "mousemove", mouseMoveListener
                                            );
                                            document.body.removeEventListener(
                                                "mouseup", mouseUpListener
                                            );
                                            clearInterval(k);
                                        };
            
                                        document.body.addEventListener(
                                            "mousemove", mouseMoveListener
                                        );
                                        document.body.addEventListener(
                                            "mouseup", mouseUpListener
                                        );
                                    }
                                )
                            },
                            onTouchMove: (
                                () => {
                                    if (!this.dragging) {
                                        this.dragging = true;

                                        const target: SVGRectElement = this.progBase.current!;
                                        const w: number = this.progW;
                                        const offset: number = (
                                            $(target).offset()?.left || 0
                                        );

                                        if (this.dom.current?.paused === false) {
                                            this.writeLog({
                                                type: "pause",
                                                prev: 0,
                                                next: 1
                                            });
                                        }

                                        this.writeLog({
                                            type: "relocate",
                                            prev: this.dom.current!.currentTime,
                                            next: this.dom.current!.currentTime
                                        });

                                        const touchMoveListener = (e: TouchEvent) => {
                                            if (e.touches.length) {
                                                this.showController("show-nofadeout");
                                                const x: number = e.touches[0].clientX - offset;
                                                const time: number = Math.max(
                                                    0, Math.min(
                                                        this.dom.current?.duration || 1,
                                                        this.state.duration / w * x
                                                    )
                                                );
                                                if (this.dom.current) {
                                                    this.dom.current.pause();
                                                    this.dom.current.currentTime = time;

                                                    this.writeLog({
                                                        type: "relocate",
                                                        prev: (
                                                            this.logs.length && this.logs[
                                                                this.logs.length - 1
                                                            ].type === "relocate"
                                                        ) ? this.logs[
                                                            this.logs.length - 1
                                                        ].prev: this.dom.current.currentTime,
                                                        next: this.dom.current.currentTime
                                                    });
                                                }
                                                this.setState({
                                                    state: "paused",
                                                    curTime: this.dom.current?.currentTime || time
                                                });
                                            }
                                        };

                                        const touchEndListener = () => {
                                            this.dragging = false;
                                            document.body.removeEventListener(
                                                "touchmove", touchMoveListener
                                            );
                                            document.body.removeEventListener(
                                                "touchend", touchEndListener
                                            );
                                            document.body.removeEventListener(
                                                "touchcancel", touchEndListener
                                            );
                                        };
            
                                        document.body.addEventListener(
                                            "touchmove", touchMoveListener
                                        );
                                        document.body.addEventListener(
                                            "touchend", touchEndListener
                                        );
                                        document.body.addEventListener(
                                            "touchcancel", touchEndListener
                                        );
                                    }
                                }
                            ),
                            key: "flag",
                            ref: this.progFlag      // 绑定引用
                        }
                    }
                    </svg>
                    {/* 总时间 */}
                    <label key="duration" style={{
                        display: "inline-block",
                        fontSize: `${ 12 * Math.sqrt(this.scaling) }px`,
                        width: `${ 48 * this.scaling }px`,
                        maxHeight: `${ 36 * this.scaling }px`,
                        color: this.controller.color
                    }} >
                        { BilibiliFlv.toTimeString(this.state.duration) }
                    </label>
                    {/* 倍速 */}
                    <svg key="speed" viewBox="0 0 48 36"
                    style={{
                        width: `${ 48 * this.scaling }px`,
                        height: `${ 36 * this.scaling }px`
                    }} >
                    {
                        this.controller.displaySpeed(
                            BilibiliFlv.PLAYBACKRATE[this.state.speedId]
                        ).map((d, i) => {
                            return {
                                ...d,
                                props: i ? {
                                    ...d.props,
                                    style: {
                                        ...d.props.style,
                                        pointerEvents: "none"
                                    }
                                } : {
                                    onClick: (e: React.MouseEvent) => {
                                        if (this.speedmenu.current) {
                                            // 更新速度设置控件位置
                                            this.speedmenu.current.style.top = `${
                                                ($(
                                                    e.currentTarget.parentElement!
                                                ).offset()?.top || 0) - (
                                                    $(window).scrollTop() || 0
                                                )
                                            }px`;
                                            this.speedmenu.current.style.left = `${
                                                ($(e.currentTarget).offset()?.left || 0) + (
                                                    $(e.currentTarget).width() || 0
                                                ) / 2
                                            }px`;

                                            // 显示隐藏速度设置控件
                                            if ($(this.speedmenu.current).css(
                                                "display"
                                            ) === "none") {
                                                $(this.speedmenu.current).show();
                                            } else {
                                                $(this.speedmenu.current).hide();
                                            }
                                        }
                                    },
                                    ...d.props
                                },
                                key: i
                            };
                        })
                    }
                    </svg>
                    {/* 速度设置 */}
                    <div key="speedmenu" ref={ this.speedmenu }
                    style={{
                        position: "fixed",
                        top: -100,
                        left: -100,
                        transform: "translate(-50%,-100%)"
                    }}
                    onMouseOver={
                        () => {
                            clearTimeout(this.timer);
                        }
                    } >
                    {
                        this.controller.displaySpeedDialog(
                            BilibiliFlv.PLAYBACKRATE,
                            this.state.speedId,
                            (id: number) => {
                                if (this.dom.current && id !== this.state.speedId) {
                                    this.writeLog({
                                        type: "setSpeed",
                                        prev: this.dom.current.playbackRate,
                                        next: BilibiliFlv.PLAYBACKRATE[id]
                                    });
                                    this.dom.current.playbackRate = (
                                        BilibiliFlv.PLAYBACKRATE[id]
                                    );
                                    this.setState({
                                        speedId: id
                                    });
                                }
                            }
                        )
                    }
                    </div>
                    {/* 音量 */}
                    <svg key="volume" viewBox="0 0 36 36"
                    style={{
                        width: `${ 36 * this.scaling }px`,
                        height: `${ 36 * this.scaling }px`
                    }} >
                    {
                        this.controller.displayVolume(
                            this.state.muted,
                            this.state.volume
                        ).map((d, i) => {
                            return {
                                ...d,
                                props: i ? {
                                    ...d.props,
                                    style: {
                                        ...d.props.style,
                                        pointerEvents: "none"
                                    }
                                } : {
                                    onClick: () => {
                                        const v: boolean = !this.dom.current!.muted;
                                        this.dom.current!.muted = v;
                                        this.writeLog({
                                            type: v ? "mute" : "unmute",
                                            prev: this.dom.current!.muted ? 0 : 1,
                                            next: v ? 1 : 0
                                        });
                                        this.setState({
                                            muted: v
                                        });
                                    },
                                    ...d.props
                                },
                                key: i
                            };
                        })
                    }
                    </svg>
                    {/* 全屏按钮 */}
                    <svg key="fullscreen" viewBox="0 0 36 36"
                    style={{
                        width: `${ 36 * this.scaling }px`,
                        height: `${ 36 * this.scaling }px`
                    }} >
                    {
                        (isFullScreen() ? this.controller.btnExitFullScreen
                            : this.controller.btnFullScreen
                        ).map((d, i) => {
                            return {
                                ...d,
                                props: i ? {
                                    ...d.props,
                                    style: {
                                        ...d.props.style,
                                        pointerEvents: "none"
                                    }
                                } : {
                                    onClick: () => this.fullScreen(),
                                    ...d.props
                                },
                                key: i
                            };
                        })
                    }
                    </svg>
                </div>
                {/* 预览器 */}
                <div key="timetip" ref={ this.timetip }
                style={{
                    pointerEvents: "none",
                    display: typeof this.focus === "number" ? "unset" : "none",
                    position: "fixed",
                    top: -100,
                    left: -100,
                    transform: "translate(-50%,-100%)"
                }} >
                {
                    this.dom.current && typeof this.focus === "number" ? (
                        (() => {
                            this.copy.currentTime = this.focus;

                            return this.controller.getSnapshot(this.focus, this.copy);
                        })()
                    ) : null
                }
                </div>
            </div>
        );
    }

    /**
     * 在组件被挂载后调用.
     *
     * @memberof BilibiliFlv
     */
    public componentDidMountRE(): void {
        if (this.canvas.current) {
            // 获取 canvas 上下文
            this.ctx = this.canvas.current.getContext("2d");
        }

        if (flvjs.isSupported() && this.dom.current) {
            // 加载视频资源
            const flvPlayer = flvjs.createPlayer({
                type: this.props.type,
                url: this.props.url
            });
            flvPlayer.attachMediaElement(this.dom.current);
            flvPlayer.load();
            this.videoState = parseVideoState((
                this.dom.current?.readyState || 0
            ) as 0 | 1 | 2 | 3 | 4);

            // 初始化设置
            this.dom.current.muted = this.state.muted;
            this.dom.current.volume = this.state.volume;
            this.dom.current.playbackRate = BilibiliFlv.PLAYBACKRATE[this.state.speedId];

            // 加载视频拷贝
            const flvPlayerSS = flvjs.createPlayer({
                type: this.props.type,
                url: this.props.url
            });
            flvPlayerSS.attachMediaElement(this.copy);
            flvPlayerSS.load();

            // 异步更新进度条外观
            setTimeout(() => {
                this.adjustBox();
            }, 0);
        }
    }

    /**
     * 在窗口触发大小改变监听后调用.
     *
     * @memberof BilibiliFlv
     */
    public componentWillResize(): void {
        if (this.speedmenu.current) {
            // 隐藏播放速度设置界面
            if ($(this.speedmenu.current).css("display") !== "none") {
                $(this.speedmenu.current).hide();
            }
        }

        if (this.dom.current) {
            const w: number = this.dom.current.offsetWidth;
            
            $(this.dom.current).ready(() => {
                if (this.canvas.current) {
                    // 更新画布定位
                    this.canvas.current.style.display = "unset";
                    this.canvas.current.width = w;
                    this.canvas.current.height = this.dom.current!.offsetHeight;
                    this.canvas.current.style.top = `${
                        this.dom.current!.offsetTop - (
                            $(window).scrollTop() || 0
                        ) * 0
                    }px`;
                    this.canvas.current.style.left = `${
                        this.dom.current!.offsetLeft
                    }px`;
                }
            });
    
            if (w !== this.state.w) {
                setTimeout(() => {
                    // 异步更新进度条外观
                    this.adjustBox();
                }, 0);

                // 更新状态
                this.setState({
                    w: w
                });
            }
        }
    }

    public componentDidUpdate(): void {
        // 更新控件组外观
        this.controller = this.loadController();
        // 更新进度条显示
        this.adjustProgress();
    }

    /**
     * 组件被卸载前调用.
     *
     * @memberof BilibiliFlv
     */
    public componentWillUnmountRE(): void {
        // 清除定时器
        clearTimeout(this.timer);
        clearTimeout(this.timerCanvas);
    }


    // 视频播放相关接口
    
    /**
     * 播放视频.
     *
     * @public
     * @returns {void}
     * @memberof BilibiliFlv
     */
    public play(): void {
        if (!flvjs.isSupported() || !this.dom.current) {
            return;
        }
        if (this.dom.current.paused) {
            this.writeLog({
                type: "play",
                prev: 0,
                next: 1
            });
            this.dom.current.play();
            this.setState({
                state: "playing"
            });
        }
    }

    /**
     * 暂停视频.
     *
     * @public
     * @returns {void}
     * @memberof BilibiliFlv
     */
    public pause(): void {
        if (!flvjs.isSupported() || !this.dom.current) {
            return;
        }
        if (!this.dom.current.paused) {
            this.writeLog({
                type: "pause",
                prev: 1,
                next: 0
            });
            this.dom.current.pause();
            this.setState({
                state: "paused"
            });
        }
    }

    /**
     * 播放或暂停视频.
     *
     * @public
     * @memberof BilibiliFlv
     */
    public playOrPause(): void {
        if (this.dom.current) {
            if (this.dom.current.paused) {
                this.play();
            } else {
                this.pause();
            }
        }
    }


    // 其他交互接口

    /**
     * 设置音量.
     *
     * @public
     * @param {number} val 设置值
     * @param {("+" | "-")} [op] 若设置值是变化量绝对值，设置此项为变化符号
     * @returns {void}
     * @memberof BilibiliFlv
     */
    public setVolume(val: number, op?: "+" | "-"): void {
        if (!this.dom.current) {
            return;
        }
        const v: number = Math.max(
            0, Math.min(
                1, op ? (
                    this.dom.current.volume + (
                        op === "+" ? 1 : -1
                    ) * val
                ) : val
            )
        );
        if (v !== this.dom.current.volume) {
            if (this.dom.current.muted && v) {
                this.writeLog({
                    type: "unmute",
                    prev: 1,
                    next: 0
                });
            }

            this.writeLog({
                type: "setVolume",
                prev: this.dom.current.volume,
                next: v
            });
            
            if (!this.dom.current.muted && v === 0) {
                this.writeLog({
                    type: "mute",
                    prev: 0,
                    next: 1
                });
            }

            this.dom.current.volume = v;
            this.dom.current.muted = this.dom.current.volume === 0;
            this.setState({
                volume: this.dom.current.volume,
                muted: this.dom.current.volume === 0
            });
        }
    }

    /**
     * 定位播放位置.
     *
     * @public
     * @param {number} val 设置值
     * @param {("+" | "-")} [op] 若设置值是变化量绝对值，设置此项为变化符号
     * @returns {void}
     * @memberof BilibiliFlv
     */
    public setTime(val: number, op?: "+" | "-"): void {
        if (!this.dom.current) {
            return;
        }
        const v: number = Math.max(
            0, Math.min(
                this.dom.current.duration - 0.1, op ? (
                    this.dom.current.currentTime + (
                        op === "+" ? 1 : -1
                    ) * val
                ) : val
            )
        );
        if (v !== this.dom.current.currentTime) {
            this.writeLog({
                type: "relocate",
                prev: this.dom.current.currentTime,
                next: v
            });

            this.dom.current.currentTime = v;
            this.setState({
                curTime: this.dom.current.currentTime
            });
        }
    }

    protected fullScreen(): void {
        if (!this.dom.current) {
            return;
        }

        $(this.dom.current).focus();
        
        if (isFullScreen()) {
            // 退出全屏
            let possibleKeysCanceling: Array<string> = [];
            for (const key in document) {
                if (key.toLocaleLowerCase().includes("cancelfullscreen")
                && typeof (document as any)[key] === "function") {
                    possibleKeysCanceling.push(key);
                }
            }
            if (possibleKeysCanceling.length) {
                (document as any)[possibleKeysCanceling[0]]();
                this.forceUpdate();
            }

            this.writeLog({
                type: "exitfullscreen",
                prev: 1,
                next: 0
            });
        } else {
            // 全屏
            const container: HTMLDivElement = this.dom.current.parentElement! as HTMLDivElement;
            let possibleKeysRequesting: Array<string> = [];
            for (const key in container) {
                if (key.toLocaleLowerCase().includes("requestfullscreen")
                && typeof (container as any)[key] === "function") {
                    possibleKeysRequesting.push(key);
                }
            }
            if (possibleKeysRequesting.length) {
                (container as any)[possibleKeysRequesting[0]]();
                this.forceUpdate();
            }

            this.writeLog({
                type: "fullscreen",
                prev: 0,
                next: 1
            });
        }
    }


    // 渲染辅助方法

    /**
     * 获取控件组外观.
     *
     * @protected
     * @returns {BilibiliFlvControlInterface}
     * @memberof BilibiliFlv
     */
    protected loadController(): BilibiliFlvControlInterface {
        return {
            ...BilibiliFlvControlDefault,
            ...this.state.control
        }
    }

    /**
     * 由于在响应式布局中，控件组高度会进行缩放，
     * 进度条作为弹性元素会在水平方向伸缩，无法控制内部图形的高度和垂直方向定位，
     * 通过调用这个方法，将一个属性对象中与高度、半径和y坐标相关的SVG属性值统一缩放.
     *
     * @private
     * @param {JSX.Element["props"]} props 目标属性对象
     * @returns {JSX.Element["props"]>}
     * @memberof BilibiliFlv
     */
    private scaleY(props: JSX.Element["props"]): JSX.Element["props"] {
        return {
            ...props,
            y: parseFloat(props.y || "0") * this.scaling || void 0,
            y1: parseFloat(props.y1 || "0") * this.scaling || void 0,
            y2: parseFloat(props.y2 || "0") * this.scaling || void 0,
            cy: parseFloat(props.cy || "0") * this.scaling || void 0,
            r: parseFloat(props.r || "0") * this.scaling || void 0,
            rx: parseFloat(props.rx || "0") * this.scaling || void 0,
            ry: parseFloat(props.ry || "0") * this.scaling || void 0,
            height: parseFloat(props.height || "0") * this.scaling || void 0
        };
    }

    /**
     * 调整进度条元素.
     *
     * @protected
     * @returns {void}
     * @memberof BilibiliFlv
     */
    protected adjustBox(): void {
        if (!this.progBase.current || !this.progBuffer.current
            || !this.progCurrent.current || !this.progFlag.current
            || !this.progBase.current.parentElement) {
            return;
        }

        if (this.control.current) {
            clearTimeout(this.timer);
            $(this.control.current).show();
            this.timer = setTimeout(() => {
                $(this.control.current || {}).fadeOut(800);
                if (this.speedmenu.current) {
                    if ($(this.speedmenu.current).css("display") !== "none") {
                        $(this.speedmenu.current).hide();
                    }
                }
            }, 1600);
        } else {
            return;
        }

        const w: number = (
            this.progBase.current.parentElement.clientWidth
        );

        this.progW = w - 40 * this.scaling;
        
        // progress-base
        this.progBase.current.setAttribute("width", `${ this.progW }px`);
        // progress-buffered
        this.progBuffer.current.setAttribute("width", `${
            this.progW / this.state.duration * this.state.buffered || 0
        }px`);
        // progress-current
        this.progCurrent.current.setAttribute("width", `${
            this.progW / this.state.duration * this.state.curTime || 0
        }px`);
        // progress-flag
        this.progFlag.current.style.transform = `translate(${
            (this.progW / this.state.duration * this.state.curTime) + 20 * this.scaling
        }px, 50%)`;
    }

    /**
     * 调整进度条.
     *
     * @private
     * @returns {void}
     * @memberof BilibiliFlv
     */
    private adjustProgress(): void {
        if (!this.progBase.current || !this.progBuffer.current
            || !this.progCurrent.current || !this.progFlag.current) {
            return;
        }

        const w: number = this.progW;
        
        // progress-buffered
        this.progBuffer.current.setAttribute("width", `${
            w / this.state.duration * this.state.buffered || 0
        }px`);
        // progress-current
        this.progCurrent.current.setAttribute("width", `${
            w / this.state.duration * this.state.curTime || 0
        }px`);
        // progress-flag
        this.progFlag.current.style.transform = `translate(${
            (w / this.state.duration * this.state.curTime) + 20 * this.scaling
        }px, 50%)`;
    }

    /**
     * 显示控件组.
     *
     * - mode === "fadein"          淡入，一定时间后淡出
     * - mode === "fadein-nofadeout"淡入
     * - mode === "show"            直接显示，一定时间后淡出
     * - mode === "show-nofadeout"  直接显示
     * @protected
     * @param {("fadein" | "fadein-nofadeout" | "show" | "show-nofadeout")} mode
     * @memberof BilibiliFlv
     */
    protected showController(mode: "fadein" | "fadein-nofadeout" | "show" | "show-nofadeout"): void {
        if (this.control.current) {
            // 停止淡出定时
            clearTimeout(this.timer);

            if (mode === "fadein") {
                // 淡入
                $(this.control.current).fadeIn(200);
            } else {
                // 直接显示
                $(this.control.current).show().css("opacity", 1);
            }

            if (!mode.endsWith("nofadeout")) {
                // 重设淡出定时
                this.timer = setTimeout(() => {
                    if (this.control.current) {
                        $(this.control.current).fadeOut(800);
                    }
                    if (this.speedmenu.current) {
                        // 隐藏播放速度设置界面
                        if ($(this.speedmenu.current).css("display") !== "none") {
                            $(this.speedmenu.current).hide();
                        }
                    }
                }, 1600);
            }
        }
    }

    /**
     * 发送有关上下文，尝试一次画布绘制.
     *
     * @protected
     * @memberof BilibiliFlv
     */
    protected handleCanvasRender(): void {
        if (this.canvas.current && this.ctx) {
            // 清空画布
            const w: number = this.canvas.current.width;
            this.canvas.current.width = w;
            // 调用绘制
            this.controller.canvasRender({
                ctx: this.ctx,
                w: this.canvas.current.width,
                h: this.canvas.current.height,
                dataState: this.videoState,
                paused: this.dom.current?.paused || false,
                muted: this.dom.current?.muted || false,
                logs: this.logs
            });
        }
    }


    // 交互控制逻辑

    /**
     * 判断和执行 keyPress 监听.
     *
     * @protected
     * @param {number} which
     * @returns {boolean}
     * @memberof BilibiliFlv
     */
    protected handleKeyPress(which: number): boolean {
        if (!this.control.current || !this.dom.current) {
            return false;
        }

        switch (which) {
            case 13:    // enter
                this.fullScreen();
                break;
            case 32:    // space
                if (this.dom.current.paused) {
                    this.play();
                } else {
                    this.pause();
                }
                break;
            case 61:    // =
            case 43:    // +
                this.setVolume(0.05, "+");
                break;
            case 45:    // -
            case 95:    // _
                this.setVolume(0.05, "-");
                break;
            default:
                return false;
        }

        this.showController("fadein");
        
        return true;
    }

    /**
     * 判断和执行 keyDown 监听，受交互锁制约.
     *
     * @protected
     * @param {number} which
     * @returns {boolean}
     * @memberof BilibiliFlv
     */
    protected handleKeyDown(which: number): boolean {
        if (!this.control.current || !this.dom.current || this.keyDownLock) {
            return false;
        }

        switch (which) {
            case 38:    // up
                this.setVolume(0.05, "+");
                break;
            case 40:    // down
                this.setVolume(0.05, "-");
                break;
            case 37:    // left
                this.setTime(15, "-");
                break;
            case 39:    // right
                this.setTime(15, "+");
                break;
            default:
                return false;
        }

        this.keyDownLock = true;

        this.showController("fadein");
        
        return true;
    }


    // 日志管理方法

    /**
     * 增加日志记录.
     *
     * @protected
     * @param {Omit<BilibiliFlvEventLog, "time">} log 新的日志信息
     * @memberof BilibiliFlv
     */
    protected writeLog(log: Omit<BilibiliFlvEventLog, "time">): void {
        // 添加
        this.logs.push({
            ...log,
            time: (new Date()).getTime()
        });

        if (this.logs.length > this.maxLogLength) {
            // 移除第一个记录
            this.logs.shift();
        }
    }

};


/**
 * 视频的播放状态.
 *
 * @export
 */
export type VideoState = (
    "HAVE_NOTHING"          // 没有关于音频/视频是否就绪的信息
    | "HAVE_METADATA"       // 关于音频/视频就绪的元数据
    | "HAVE_CURRENT_DATA"   // 关于当前播放位置的数据是可用的，但没有足够的数据来播放下一帧/毫秒
    | "HAVE_FUTURE_DATA"    // 当前及至少下一帧的数据是可用的
    | "HAVE_ENOUGH_DATA"    // 可用数据足以开始播放
);

/**
 * 解析 video 对象的 readyState 属性值.
 *
 * @export
 * @param {(0 | 1 | 2 | 3 | 4)} videoReadyState readyState 属性值
 * @returns {VideoState}
 */
export const parseVideoState = (videoReadyState: 0 | 1 | 2 | 3 | 4): VideoState => {
    switch (videoReadyState) {
        case 0:
            return "HAVE_NOTHING";
        case 1:
            return "HAVE_METADATA";
        case 2:
            return "HAVE_CURRENT_DATA";
        case 3:
            return "HAVE_FUTURE_DATA";
        case 4:
            return "HAVE_ENOUGH_DATA";
    }
};


/**
 * 视频的日志记录.
 *
 * @export
 */
export type BilibiliFlvEvent = (
    "play" | "pause" | "setVolume" | "setSpeed" | "relocate" | "mute" | "unmute"
    | "fullscreen" | "exitfullscreen"
);

/**
 * 播放器组件的输出日志.
 *
 * @export
 * @interface BilibiliFlvEventLog
 */
export interface BilibiliFlvEventLog {
    type: BilibiliFlvEvent;     // 响应事件
    time: number;               // 响应发生时间
    prev: number;               // 原始值
    next: number;               // 更新值
};


/**
 * 播放器画布的绘制情景.
 *
 * @export
 */
export type CanvasRenderingEvent = {
    ctx: CanvasRenderingContext2D;      // 用于绘制的 canvas 上下文
    w: number;                          // canvas 元素的实际宽度
    h: number;                          // canvas 元素的实际高度
    dataState: VideoState;              // 视频就绪情况
    paused: boolean;                    // 视频是否暂停
    muted: boolean;                     // 视频是否静音
    logs: Array<BilibiliFlvEventLog>;   // 播放器组件的输出日志
};


/**
 * 播放器组件的控制条元素.
 *
 * @export
 * @interface BilibiliFlvControlInterface
 */
export interface BilibiliFlvControlInterface {
    /** 整体背景样式 (style.background) */
    background: string;

    /** 播放按钮 */
    btnPlay: Array<JSX.Element>;    // 第一个元素作为判断交互的碰撞箱 (下同)
    /** 暂停按钮 */
    btnStop: Array<JSX.Element>;

    /** 时间字体颜色 */
    color: string;

    /** 进度条：背景，rect，x坐标自动延伸 */
    progressBase: JSX.Element;
    /** 进度条：加载，rect，x坐标自动定位 */
    progressBuffer: JSX.Element;
    /** 进度条：进度，rect，x坐标自动定位 */
    progressCurrent: JSX.Element;
    /** 进度条：图标，transformY(50%)，transformX自动定位 */
    progressFlag: JSX.Element;

    /**
     * 渲染快照预览.
     * 
     * @param {number} time 聚焦时间(秒)
     * @param {HTMLVideoElement} o 呈现预览的静态video元素
     * @returns {JSX.Element} ReactDOM元素
     * @memberof BilibiliFlvControlInterface
     */
    getSnapshot(time: number, o: HTMLVideoElement): JSX.Element;

    /**
     * 渲染播放速度图标.
     *
     * @param {number} speed 当前播放速度
     * @returns {Array<JSX.Element>} ReactSVG元素列表，仅第一个元素会响应交互
     * @memberof BilibiliFlvControlInterface
     */
    displaySpeed(speed: number): Array<JSX.Element>;
    /**
     * 渲染播放速度设置框，自动定位至图标上方水平居中.
     *
     * @param {Array<number>} options 可选择的播放速度选项
     * @param {number} curId 当前播放速度对应的索引值
     * @param {(clicked: number) => void} handler 调用以更新播放速度
     * - param {number} clicked 选择选项对应的索引值
     * @returns {JSX.Element} ReactDOM元素，需要自定义交互
     * @memberof BilibiliFlvControlInterface
     */
    displaySpeedDialog(
        options: Array<number>, curId: number, handler: (clicked: number) => void
    ): JSX.Element;

    /**
     * 渲染音量按钮.
     *
     * @param {boolean} muted 是否静音
     * @param {number} volume 音量大小(float~0-1)
     * @returns {Array<JSX.Element>} ReactSVG元素列表，仅第一个元素会响应交互
     * @memberof BilibiliFlvControlInterface
     */
    displayVolume(muted: boolean, volume: number): Array<JSX.Element>;

    /** 全屏按钮 */
    btnFullScreen: Array<JSX.Element>;
    /** 退出全屏按钮 */
    btnExitFullScreen: Array<JSX.Element>;

    /**
     * 响应视频行为的画布绘制.
     *
     * @param {CanvasRenderingEvent} event 激活事件名称
     * @memberof BilibiliFlvControlInterface
     */
    canvasRender(event: CanvasRenderingEvent): void;
};

/**
 * 默认的控制条元素.
 */
export const BilibiliFlvControlDefault: BilibiliFlvControlInterface = {
    background: "rgba(30,30,30,0.9)",

    btnPlay: [(
        <circle
        cx="18" cy="18" r="16"
        style={{
            fill: "#00000000"
        }} />
    ), (
        <path d={
            "M11,10 Q11,8 17,11.33 L25,15.78 Q29,18 25,20.22 L17,24.67 Q11,28 11,26 Z"
        }
        style={{
            fill: "rgb(250,250,250)"
        }} />
    )],
    btnStop: [(
        <circle
        cx="18" cy="18" r="16"
        style={{
            fill: "#00000000"
        }} />
    ), (
        <path d={
            "M11,10 L15,10 L15,26 L11,26 Z M21,10 L25,10 L25,26 L21,26 Z"
        }
        style={{
            fill: "rgb(250,250,250)"
        }} />
    )],

    color: "rgb(255,255,255)",

    progressBase: (
        <rect y="15" height="6" rx="3" ry="3"
        style={{
            fill: "rgb(90,90,90)"
        }} />
    ),
    progressBuffer: (
        <rect y="15" height="6" rx="3" ry="3"
        style={{
            fill: "rgb(124,124,124)"
        }} />
    ),
    progressCurrent: (
        <rect y="15" height="6" rx="3" ry="3"
        style={{
            fill: "rgb(203,200,202)"
        }} />
    ),
    progressFlag: (
        <circle cy="0" r="6" cx="0"
        style={{
            fill: "rgb(255,255,255)",
            stroke: "rgb(30,30,30)"
        }} />
    ),

    getSnapshot: (time: number, o: HTMLVideoElement) => {
        const randomId: string = (Math.random() * 1e6).toFixed(0);

        setTimeout(() => {
            $(`#${ randomId }`).append(o);
        }, 20);

        return (
            <div style={{
                width: "16vmin",
                backgroundColor: "rgb(30,30,30)",
                padding: "4px"
            }} >
                <div id={ randomId }
                style={{
                    display: "block"
                }} />
                <label
                style={{
                    display: "block",
                    fontSize: "12px"
                }} >
                    { BilibiliFlv.toTimeString(time) }
                </label>
            </div>
        );
    },

    displaySpeed: (speed: number) => {
        return [(
            <rect key="interaction"
            x="6" width="36" y="10" height="16"
            style={{
                fill: "#00000000",
                stroke: "rgb(220,220,220)",
                strokeWidth: 1.6
            }} />
        ), (
            <text key="label" textAnchor="middle"
            x="24" y="18"
            style={{
                fill: "rgb(255,255,255)",
                fontSize: "12px",
                transform: "translateY(0.33em)"
            }} >
                { speed + "x" }
            </text>
        )];
    },
    displaySpeedDialog: (
        options: number[], curId: number, handler: (clicked: number) => void
    ) => {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "1vmin",
                backgroundColor: "rgba(37,37,40,0.9)",
                textAlign: "center",
                fontSize: "calc(6px + 1vmin)",
                color: "rgb(255,255,255)"
            }} >
            {
                options.map((d, i) => {
                    return (
                        <label key={ i }
                        onClick={
                            i === curId ? (void 0) : () => {
                                handler(i);
                            }
                        }
                        style={{
                            padding: "0.2em 0.4em",
                            margin: "0.2em 0",
                            border: `1px solid rgba(255,255,255,${ i === curId ? 1 : 0.4 })`
                        }} >
                            { d + "x" }
                        </label>
                    );
                })
            }
            </div>
        );
    },

    displayVolume: (muted: boolean, volume: number) => {
        const f = (val: number) => (220 - 260 * val) / 180 * Math.PI;
        const tickC: number = 5 + Math.floor(window.innerWidth / 360) * 2;
        const ticks: Array<number> = new Array<number>(tickC).fill(0).map(
            (_, i) => i / (tickC - 1)
        );

        return [(
            <circle key="interaction"
            cx="18" cy="18" r="16"
            style={{
                fill: "#00000000"
            }} />
        ), ...ticks.map(
            (d, i) => {
                return (
                    <line
                    x1={ 18 + Math.cos(f(d)) * 9 } x2={ 18 + Math.cos(f(d)) * 13 }
                    y1={ 20 - Math.sin(f(d)) * 9 } y2={ 20 - Math.sin(f(d)) * 13 }
                    style={{
                        stroke: "rgba(220,220,220,0.5)",
                        strokeWidth: i === 0 ? 2.4 : 1.2
                    }} />
                );
            }
        ), (
            <circle key="btn"
            cx="18" cy="20" r="7.5"
            style={{
                fill: muted ? "rgba(250,250,250,0.6)" : "rgb(250,250,250)"
            }} />
        ), (
            <circle key="pointer" r="3"
            cx={ 18 + Math.cos(f(volume)) * 4 }
            cy={ 20 - Math.sin(f(volume)) * 4 }
            style={{
                fill: muted ? "rgba(37,37,37,0.6)" : "rgb(242,55,38)"
            }} />
        )];
    },

    btnFullScreen: [(
        <circle
        cx="18" cy="18" r="16"
        style={{
            fill: "#00000000"
        }} />
    ), (
        <path d={
            "M8,16 L8,10 L14,10 "
            + "M22,10 L28,10 L28,16 "
            + "M28,20 L28,26 L22,26 "
            + "M14,26 L8,26 L8,20"
        }
        style={{
            fill: "none",
            stroke: "rgb(250,250,250)",
            strokeWidth: 2
        }} />
    )],
    btnExitFullScreen: [(
        <circle
        cx="18" cy="18" r="16"
        style={{
            fill: "#00000000"
        }} />
    ), (
        <path d={
            "M8,15 L14,15 L14,10 "
            + "M22,10 L22,15 L28,15 "
            + "M28,21 L22,21 L22,26 "
            + "M14,26 L14,21 L8,21"
        }
        style={{
            fill: "none",
            stroke: "rgb(250,250,250)",
            strokeWidth: 2
        }} />
    )],

    canvasRender: (event: CanvasRenderingEvent) => {
        if (event.logs.length) {
            // 日志输出
            const time: number = (new Date()).getTime();
            const ft = (t: number) => (
                1 - (time - t) / 3000
            );
            const y: number = event.h * 0.7;
            /** 3秒内产生的最后四条 */
            const logs: Array<BilibiliFlvEventLog & { dt: number; }> = event.logs.map(
                log => {
                    return {
                        ...log,
                        dt: ft(log.time)
                    };
                }
            ).filter(log => log.dt >= 0).sort((a, b) => b.dt - a.dt).slice(0, 4);
            if (logs.length) {
                const fontSize: number = 4 + Math.min(event.w, event.h) / 36;
                event.ctx.font = `${ fontSize }px normal source-code-pro`;
                event.ctx.textAlign = "left";
                event.ctx.textBaseline = "top";

                logs.reverse().forEach((log, i) => {
                    event.ctx.globalAlpha = log.dt;
                    event.ctx.fillStyle = `rgb(50,50,50)`;
                    event.ctx.fillRect(
                        fontSize,
                        y + fontSize * i * 2,
                        event.w * 0.1 + fontSize * 6,
                        fontSize * 1.6
                    );
                    event.ctx.fillStyle = `rgb(220,220,220)`;
                    event.ctx.fillText((
                        log.type === "exitfullscreen" ? "exit fullscreen"
                            : log.type === "fullscreen" ? "fullscreen mode"
                                : log.type === "mute" ? "mute"
                                    : log.type === "pause" ? "paused"
                                        : log.type === "play" ? "resume"
                                            : log.type === "relocate" ? (
                                                log.next >= log.prev ? `fast forward ${
                                                    Math.round(log.next - log.prev)
                                                } sec` : `backward ${
                                                    Math.round(log.prev - log.next)
                                                } sec`
                                            ) : log.type === "setSpeed" ? `speed set to ${
                                                log.next
                                            }` : log.type === "setVolume" ? `volume: ${
                                                log.next.toFixed(2)
                                            }` : "unmute"
                    ), 8 + fontSize, y + fontSize * 0.3 + fontSize * i * 2);
                });

                event.ctx.globalAlpha = 1;
            }
        }

        if (event.dataState === "HAVE_FUTURE_DATA" || event.dataState === "HAVE_ENOUGH_DATA") {
            return;
        }
        if (event.dataState === "HAVE_NOTHING") {
            event.ctx.fillStyle = "rgba(39,37,40,0.9)";
            event.ctx.fillRect(0, 0, event.w, event.h);
        }

        // 加载特效：旋转
        const f = (val: number) => val / 8 * 2 * Math.PI;
        const x: number = event.w / 2;
        const y: number = event.h / 2;
        const d: number = Math.min(x, y) / 8;
        let r: number = d / 4;
        const t: number = 7 - Math.floor(
            ((
                (new Date()).getMilliseconds()
            ) / 125)
        ) % 8;
        for (let i: number = 0; i < 8; i++) {
            const cx: number = x + Math.cos(f(i + t)) * d;
            const cy: number = y - Math.sin(f(i + t)) * d;
            
            event.ctx.fillStyle = `rgba(225,225,225,${ 1 - 0.1 * i })`;
            event.ctx.beginPath();
            event.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            event.ctx.fill();

            r *= 0.9;
        }
    }
};


/**
 * 播放器的控件栏自定义外观.
 *
 * @export
 */
export type BilibiliFlvControlAppearance = Partial<BilibiliFlvControlInterface>;
