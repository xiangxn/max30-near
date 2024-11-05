// /*******************************************************************************
//  * 创建: 2023年08月27日
//  * 作者: 水煮肉片饭(27185709@qq.com)
//  * 描述: 连发按钮
//  * 1、BurstButton按下后无论是否移动，都会触发burst事件
//  *    连发功能默认关闭，并不会产生额外开销
//  * 2、动画（缩放、变色、换图）可以并存
//  * 3、可以设置按下、抬起、取消的触发音效
//  * 4、优化了事件处理机制，可通过setCallback指定事件回调，建议同一个页面下所有BurstButton指向同一个回调函数
//  *    tag：按钮节点name
//  *    event：按下Press，连发Burst，抬起Release，取消Cancel
//  *    parms[0]：按钮组件对象
// *******************************************************************************/

import { _decorator, color, AudioClip, Component, Enum, Color, Sprite, SpriteFrame, Vec2, v2, Node, UITransform, macro, AudioSource, tween } from 'cc';
const { ccclass, property, menu } = _decorator;

enum EffectType { 无, 变色, 换图 }
const DISABLE_COLOR = color(80, 80, 80);

@ccclass('Audio')
class Audio {
    @property({ displayName: '按下', type: AudioClip })
    press: AudioClip | null = null;
    @property({ displayName: '抬起', type: AudioClip })
    release: AudioClip | null = null;
    @property({ displayName: '取消', type: AudioClip })
    cancel: AudioClip | null = null;
    audioSource: AudioSource = new AudioSource();


    protected onDestroy() {
        this.audioSource.destroy();
    }

    public playRelease() {
        if (this.audioSource && this.release) {
            this.audioSource.playOneShot(this.release, 1);
        }
    }

    public playPress() {
        if (this.audioSource && this.press) {
            this.audioSource.playOneShot(this.press, 1);
        }
    }

    public playCancel() {
        if (this.audioSource && this.cancel) {
            this.audioSource.playOneShot(this.cancel, 1);
        }
    }
}

@ccclass('BurstButton')
@menu('Comp/BurstButton')
export default class BurstButton extends Component {
    @property({ displayName: '是否连发', tooltip: '不需要连发的按钮，可以关闭连发减小开销' })
    private isBurst: boolean = false;
    @property({ min: 0, displayName: '······延迟时间（秒）', tooltip: '按下几秒后开始连发', visible() { return this.isBurst } })
    private delayTime: number = 0;
    @property({ min: 0, displayName: '······连发间隔（秒）', tooltip: '每隔几秒触发一次', visible() { return this.isBurst } })
    private intervalTime: number = 0.1;
    @property({ min: 0, displayName: '按下后缩放' })
    private pressScale: number = 0.9;
    @property({ type: Enum(EffectType), displayName: '动画' })
    private effectType: EffectType = EffectType.无;
    @property({ displayName: '······按下后变色', visible() { return this.effectType === EffectType.变色 } })
    private pressColor: Color = color(255, 255, 255);
    @property({ displayName: '······禁用后变色', visible() { return this.effectType === EffectType.变色 } })
    private disableColor: Color = DISABLE_COLOR;
    @property({ min: 0, displayName: '······变色时间（秒）', visible() { return this.effectType === EffectType.变色 } })
    private colorTime: number = 0.2;
    @property
    private _effectSprite: Sprite | null = null;
    @property({ type: Sprite, displayName: '······换图对象', tooltip: '把挂载Sprite的节点拖进来', visible() { return this.effectType === EffectType.换图 } })
    private get effectSprite() { return this._effectSprite }
    private set effectSprite(value: Sprite) {
        // if (this._effectSprite === value) return;
        // this._effectSprite = value;
        // this.updateEffectSprite();
    }
    @property({ type: SpriteFrame, displayName: '······按下后换图', visible() { return this.effectType === EffectType.换图 } })
    private pressFrame: SpriteFrame | null = null;
    @property({ type: SpriteFrame, displayName: '······禁用后换图', visible() { return this.effectType === EffectType.换图 } })
    private disableFrame: SpriteFrame | null = null;
    @property({ type: Audio, displayName: '音效', tooltip: '把需要播放的音效文件拖进来' })
    private audio: Audio = new Audio();
    private _isActive: boolean = true;
    get isActive() { return this._isActive; }
    set isActive(value: boolean) {
        // this._isActive = value;
        // this.updateActive();
    }
    private normalScale: Vec2 = v2(1, 1);
    private normalFrame: SpriteFrame | null = null;
    private callback: (tag: string, event: string, ...parms: any[]) => void = () => { };

    protected start() {
        this.normalScale.x = this.node.scale.x;
        this.normalScale.y = this.node.scale.y;
        this.updateEffectSprite();
        this.updateActive();
        this.updateSize();
        this.node.on(Node.EventType.SIZE_CHANGED, this.updateSize, this);
    }
    setCallback(callback: (tag: string, event: string, ...parms: any[]) => void, bind: any) {
        this.callback = callback.bind(bind);
    }
    private updateSize() {
        if (this.node.getComponent(UITransform).width === 0 || this.node.getComponent(UITransform).height === 0) {
            console.warn(`按钮宽高为0，无法响应触摸事件！(${this.node.parent?.parent?.name}/${this.node.parent?.name}/${this.node.name})`);
        }
    }
    private updateEffectSprite() {
        if (this.effectSprite) {
            this.normalFrame = this.effectSprite.spriteFrame;
            this.effectSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }
    }
    private updateActive() {
        if (this.isActive) {
            switch (this.effectType) {
                case EffectType.变色: this.setColor(this.node, this.colorTime); break;
                case EffectType.换图: this.effectSprite && (this.effectSprite.spriteFrame = this.normalFrame); break;
            }
            this.node.on(Node.EventType.TOUCH_START, this.touchStart, this);
            this.node.on(Node.EventType.TOUCH_END, this.touchEnd, this);
            this.node.on(Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
        } else {
            this.node.setScale(this.normalScale.x, this.normalScale.y);
            this.isBurst && this.unschedule(this.touchBurst);
            switch (this.effectType) {
                case EffectType.变色: this.setColor(this.node, 0, this.disableColor); break;
                case EffectType.换图: this.effectSprite && (this.effectSprite.spriteFrame = this.disableFrame); break;
            }
            this.node.off(Node.EventType.TOUCH_START, this.touchStart, this);
            this.node.off(Node.EventType.TOUCH_END, this.touchEnd, this);
            this.node.off(Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
        }
    }
    private touchStart() {
        this.audio.press && this.audio.playPress()
        this.node.setScale(this.pressScale * this.normalScale.x, this.pressScale * this.normalScale.y);
        this.isBurst && this.schedule(this.touchBurst, this.intervalTime, macro.REPEAT_FOREVER, this.delayTime);
        switch (this.effectType) {
            case EffectType.变色: this.setColor(this.node, this.colorTime, this.pressColor); break;
            case EffectType.换图: this.effectSprite && (this.effectSprite.spriteFrame = this.pressFrame); break;
        }
        this.callback(this.node.name, 'Press', this);
    }
    private touchBurst() {
        this.callback(this.node.name, 'Burst', this);
    }
    private touchEnd() {
        this.audio.release && this.audio.playRelease();
        this.node.setScale(this.normalScale.x, this.normalScale.y);
        this.isBurst && this.unschedule(this.touchBurst);
        switch (this.effectType) {
            case EffectType.变色: this.setColor(this.node, this.colorTime); break;
            case EffectType.换图: this.effectSprite && (this.effectSprite.spriteFrame = this.normalFrame); break;
        }
        this.callback(this.node.name, 'Release', this);
    }
    private touchCancel() {
        this.audio.cancel && this.audio.playCancel();
        this.node.setScale(this.normalScale.x, this.normalScale.y);
        this.isBurst && this.unschedule(this.touchBurst);
        switch (this.effectType) {
            case EffectType.变色: this.setColor(this.node, this.colorTime); break;
            case EffectType.换图: this.effectSprite && (this.effectSprite.spriteFrame = this.normalFrame); break;
        }
        this.callback(this.node.name, 'Cancel', this);
    }
    private setColor(node: Node, time: number, color?: Color) {
        node['colorTween']?.stop();
        let sprite = node.getComponent(Sprite);
        if (color === undefined) {
            if (node['defaultColor'] !== undefined) {
                node['colorTween'] = tween(sprite).to(time, { color: node['defaultColor'] }).call(() => { delete node['defaultColor']; delete node['colorTween']; }).start();
            }
        } else {
            let defaultColor = node['defaultColor'] ??= sprite.color;
            let changeColor: Color;
            Color.fromArray([defaultColor.r * color.r / 255, defaultColor.g * color.g / 255, defaultColor.b * color.b / 255], changeColor);
            time === 0 ? sprite.color = changeColor : node['colorTween'] = tween(sprite).to(time, { color: changeColor }).start();
        }

        for (let i = node.children.length - 1; i > -1; this.setColor(node.children[i--], time, color));
    }
    protected onDestroy() {
        this.node.off(Node.EventType.SIZE_CHANGED, this.updateSize, this);
        this.node.off(Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
    }
}