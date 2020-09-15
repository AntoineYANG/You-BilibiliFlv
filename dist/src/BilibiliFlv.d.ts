import React from "react";
import ResponsiveComponent from "you-responsivecomponent";
export declare const isFullScreen: () => boolean;
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
}
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
}
/**
 * 基于 bilibili/flv.js 制作的组件.
 *
 * @export
 * @class BilibiliFlv
 * @extends {ResponsiveComponent<BilibiliFlvProps, BilibiliFlvState>}
 */
export declare class BilibiliFlv extends ResponsiveComponent<BilibiliFlvProps, BilibiliFlvState> {
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
    static readonly PLAYBACKRATE: Array<number>;
    /**
     * 原生播放器元素的引用.
     *
     * @protected
     * @type {React.RefObject<HTMLVideoElement>}
     * @memberof BilibiliFlv
     */
    protected dom: React.RefObject<HTMLVideoElement>;
    /**
     * 无交互进度条的容器的引用.
     *
     * @protected
     * @type {React.RefObject<SVGSVGElement>}
     * @memberof BilibiliFlv
     */
    protected prog: React.RefObject<SVGSVGElement>;
    /**
     * 无交互进度条的引用.
     *
     * @protected
     * @type {React.RefObject<SVGRectElement>}
     * @memberof BilibiliFlv
     */
    protected progBar: React.RefObject<SVGRectElement>;
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
    /**
     * 控件栏外观.
     *
     * @protected
     * @type {BilibiliFlvControlInterface}
     * @memberof BilibiliFlv
     */
    protected controller: BilibiliFlvControlInterface;
    /**
     * 进度条显示宽度（像素）.
     *
     * @private
     * @type {number}
     * @memberof BilibiliFlv
     */
    private progW;
    /**
     * 缩放比例（以1为基准）.
     *
     * @private
     * @type {number}
     * @memberof BilibiliFlv
     */
    private scaling;
    /**
     * 预览时间位置（秒）.
     *
     * 若未处于时间轴预览交互，该值为 null.
     *
     * @private
     * @type {(number | null)}
     * @memberof BilibiliFlv
     */
    private focus;
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
    private copy;
    /**
     * 当前视频的资源加载状况.
     *
     * @protected
     * @type {VideoState}
     * @memberof BilibiliFlv
     */
    protected videoState: VideoState;
    /**
     * 延时器：用于管理控件组元素的淡出动作.
     *
     * @private
     * @type {NodeJS.Timeout}
     * @memberof BilibiliFlv
     */
    private timer;
    /**
     * 循环器：用于周期调用关联接口进行画布绘制.
     *
     * @private
     * @type {NodeJS.Timeout}
     * @memberof BilibiliFlv
     */
    private timerCanvas;
    /**
     * 交互锁：用于防止 keyPress 事件重复触发.
     *
     * @private
     * @type {boolean}
     * @memberof BilibiliFlv
     */
    private keyDownLock;
    /**
     * 当前进度图标是否处于拖动状态.
     *
     * @private
     * @type {boolean}
     * @memberof BilibiliFlv
     */
    private dragging;
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
    private gesture;
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
    /**
     * 以 "mm:ss" 的格式转化生成时间字符串.
     *
     * @static
     * @param {number} sec 时间（秒）
     * @returns {string}
     * @memberof BilibiliFlv
     */
    static toTimeString(sec: number): string;
    constructor(props: BilibiliFlvProps);
    render(): JSX.Element;
    /**
     * 在组件被挂载后调用.
     *
     * @memberof BilibiliFlv
     */
    componentDidMountRE(): void;
    /**
     * 在窗口触发大小改变监听后调用.
     *
     * @memberof BilibiliFlv
     */
    componentWillResize(): void;
    componentDidUpdate(): void;
    /**
     * 组件被卸载前调用.
     *
     * @memberof BilibiliFlv
     */
    componentWillUnmountRE(): void;
    /**
     * 播放视频.
     *
     * @public
     * @returns {void}
     * @memberof BilibiliFlv
     */
    play(): void;
    /**
     * 暂停视频.
     *
     * @public
     * @returns {void}
     * @memberof BilibiliFlv
     */
    pause(): void;
    /**
     * 播放或暂停视频.
     *
     * @public
     * @memberof BilibiliFlv
     */
    playOrPause(): void;
    /**
     * 设置音量.
     *
     * @public
     * @param {number} val 设置值
     * @param {("+" | "-")} [op] 若设置值是变化量绝对值，设置此项为变化符号
     * @returns {void}
     * @memberof BilibiliFlv
     */
    setVolume(val: number, op?: "+" | "-"): void;
    /**
     * 定位播放位置.
     *
     * @public
     * @param {number} val 设置值
     * @param {("+" | "-")} [op] 若设置值是变化量绝对值，设置此项为变化符号
     * @returns {void}
     * @memberof BilibiliFlv
     */
    setTime(val: number, op?: "+" | "-"): void;
    protected fullScreen(): void;
    /**
     * 获取控件组外观.
     *
     * @protected
     * @returns {BilibiliFlvControlInterface}
     * @memberof BilibiliFlv
     */
    protected loadController(): BilibiliFlvControlInterface;
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
    private scaleY;
    /**
     * 调整进度条元素.
     *
     * @protected
     * @returns {void}
     * @memberof BilibiliFlv
     */
    protected adjustBox(): void;
    /**
     * 调整进度条.
     *
     * @private
     * @returns {void}
     * @memberof BilibiliFlv
     */
    private adjustProgress;
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
    protected showController(mode: "fadein" | "fadein-nofadeout" | "show" | "show-nofadeout"): void;
    /**
     * 发送有关上下文，尝试一次画布绘制.
     *
     * @protected
     * @memberof BilibiliFlv
     */
    protected handleCanvasRender(): void;
    /**
     * 判断和执行 keyPress 监听.
     *
     * @protected
     * @param {number} which
     * @returns {boolean}
     * @memberof BilibiliFlv
     */
    protected handleKeyPress(which: number): boolean;
    /**
     * 判断和执行 keyDown 监听，受交互锁制约.
     *
     * @protected
     * @param {number} which
     * @returns {boolean}
     * @memberof BilibiliFlv
     */
    protected handleKeyDown(which: number): boolean;
    /**
     * 增加日志记录.
     *
     * @protected
     * @param {Omit<BilibiliFlvEventLog, "time">} log 新的日志信息
     * @memberof BilibiliFlv
     */
    protected writeLog(log: Omit<BilibiliFlvEventLog, "time">): void;
}
/**
 * 视频的播放状态.
 *
 * @export
 */
export declare type VideoState = ("HAVE_NOTHING" | "HAVE_METADATA" | "HAVE_CURRENT_DATA" | "HAVE_FUTURE_DATA" | "HAVE_ENOUGH_DATA");
/**
 * 解析 video 对象的 readyState 属性值.
 *
 * @export
 * @param {(0 | 1 | 2 | 3 | 4)} videoReadyState readyState 属性值
 * @returns {VideoState}
 */
export declare const parseVideoState: (videoReadyState: 0 | 1 | 2 | 3 | 4) => VideoState;
/**
 * 视频的日志记录.
 *
 * @export
 */
export declare type BilibiliFlvEvent = ("play" | "pause" | "setVolume" | "setSpeed" | "relocate" | "mute" | "unmute" | "fullscreen" | "exitfullscreen");
/**
 * 播放器组件的输出日志.
 *
 * @export
 * @interface BilibiliFlvEventLog
 */
export interface BilibiliFlvEventLog {
    type: BilibiliFlvEvent;
    time: number;
    prev: number;
    next: number;
}
/**
 * 播放器画布的绘制情景.
 *
 * @export
 */
export declare type CanvasRenderingEvent = {
    ctx: CanvasRenderingContext2D;
    w: number;
    h: number;
    dataState: VideoState;
    paused: boolean;
    muted: boolean;
    logs: Array<BilibiliFlvEventLog>;
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
    btnPlay: Array<JSX.Element>;
    /** 暂停按钮 */
    btnStop: Array<JSX.Element>;
    /** 时间字体颜色 */
    color: string;
    /** 无交互进度条样式 */
    progStyle: string;
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
    displaySpeedDialog(options: Array<number>, curId: number, handler: (clicked: number) => void): JSX.Element;
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
}
/**
 * 默认的控制条元素.
 */
export declare const BilibiliFlvControlDefault: BilibiliFlvControlInterface;
/**
 * 播放器的控件栏自定义外观.
 *
 * @export
 */
export declare type BilibiliFlvControlAppearance = Partial<BilibiliFlvControlInterface>;
