import { _decorator, AudioClip, Color, Component, Graphics, Label, Sprite, Node, quat, tween, Tween, AudioSource, v3, macro } from 'cc';
const { ccclass, property } = _decorator;

import Config from './config';
import l10n from 'db://localization-editor/core/l10n-manager';

@ccclass('Roller')
export class Roller extends Component {

    @property({ displayName: "Ring", type: Graphics })
    private ring: Graphics = null;
    @property({ type: Node })
    public pointer: Node = null;
    @property({ type: Node })
    private winnerNode: Node = null;
    @property({ type: Sprite })
    private winnerColor: Sprite = null;
    @property({ type: Label })
    private winnerName: Label = null;
    @property({ type: Label })
    private winnerNum: Label = null;
    @property({ type: Label })
    private statusText: Label = null;
    @property({ type: Node })
    private betClock: Node = null;

    @property({ type: AudioClip })
    private rollEffect: AudioClip = null;

    audioSource: AudioSource = new AudioSource();


    private players = [];
    private angles = [];
    private action: Tween<Node> = null;


    protected onDestroy() {
        this.audioSource.destroy();
    }

    start() {

    }

    update(deltaTime: number) {

    }

    public showClock() {
        this.betClock.active = true;
    }

    public hideClock() {
        this.betClock.active = false;
    }

    public showStatus(str) {
        this.statusText.node.active = true;
        this.statusText.string = str;
    }

    public hideStatus() {
        this.statusText.node.active = false;
    }

    public reset() {
        console.log("reset...");
        this.ring.clear();
        this.ring.circle(0, 0, 200);
        this.ring.strokeColor = Color.BLACK.fromHEX('#373D42');
        this.ring.stroke();
        this.pointer.setRotationFromEuler(0, 0, 0);
    }

    private setAngle(player) {
        console.log("this.players:", this.players)
        console.log("this.angles:", this.angles)
        let angle = 0;
        let num_index = this.players.findIndex((p) => p.owner == player.owner);

        console.log("num_index:", num_index)

        let prev = num_index == 0 ? 0 : this.angles[num_index - 1];
        let cur = angle = this.angles[num_index];

        console.log("cur-prev:", cur, prev)
        // if (cur - prev < 6) { //居中
        //     if (num_index == 0) {
        //         angle = angle / 2;
        //     } else {
        //         angle = prev + (cur - prev) / 2;
        //     }
        // } else { //精准偏移
        //     let offset = (angle - prev - 2) / player.digital.length * num_index;
        //     if (offset == 0) offset = 1;
        //     angle = prev + offset;
        // }
        if (num_index == 0) {
            angle = angle / 2;
        } else {
            angle = prev + (cur - prev) / 2;
        }
        return (angle + 90);
    }

    public showWinner(winner, callback: Function = null) {
        console.log("showWinner:", new Date().getTime());
        this.winnerNode.active = true;
        this.statusText.node.active = false;
        this.winnerColor.color = Color.BLACK.fromHEX(Config.colors[winner.player.id]);
        this.winnerName.string = winner.player.owner;
        this.winnerNum.string = winner.lottery.toString();

        // this.action.stop();
        tween(this.winnerNode).delay(10).call(() => {
            console.log("callback:", new Date().getTime());
            this.winnerNode.active = false;
            if (callback) callback();
        }, this).start();
    }

    public setPlayers(players) {
        this.players = players;
        if (this.players.length === 0) {
            this.reset();
        } else {
            this.ring.clear();
            this.angles = [];
            var len = this.players.length;
            var c = Math.PI / 180;
            var a = 0;
            var last_a = 0;
            let g = this.ring;
            g.clear();
            g.lineWidth = 90;
            if (len > 1) {
                this.caclWinRate();
                for (var i = 0; i < len; i++) {
                    var player = this.players[i];
                    a = 360 * player.win_rate;
                    a = parseFloat(a.toFixed(2));
                    g.strokeColor = Color.WHITE.fromHEX(Config.colors[player.id]);
                    if (a < 0.36) a = 0.36;
                    let ca = last_a + a + 1;
                    if (ca > 360) ca = 360;
                    g.arc(0, 0, 200, c * (last_a == 0 ? 1 : -last_a), c * (- ca), false);
                    g.stroke();
                    last_a += a;
                    if (last_a > 360) last_a = 360;
                    this.angles.push(last_a);
                }
                // console.log("this.angles:", this.angles);
            } else if (len == 1) {
                this.ring.strokeColor = Color.BLACK.fromHEX(Config.colors[this.players[0].id]);
                this.ring.circle(0, 0, 200);
                this.ring.stroke();
                this.angles = [0];
            }
        }
    }

    // 补齐精度
    private caclWinRate() {
        let diff = 1;
        this.players.forEach((player) => {
            diff -= player.win_rate;
        });
        if (diff > 0) {
            this.players[0].win_rate += diff;
        }
    }

    public runRoller(winner = null, callback: Function = null) {
        this.hideClock();
        this.showStatus(l10n.t("waiting_for_the_draw"));
        if (this.action) {
            this.action.stop();
        }

        let finalAngle = 0;
        if (winner) {
            finalAngle = this.setAngle(winner.player);
            console.log("finalAngle:", finalAngle);
            this.playLast();
            this.pointer.setRotationFromEuler(0, 0, 0);
            this.action = tween(this.pointer).to(5, {
                angle: { value: -(360 * 6 + finalAngle), easing: "quartOut" }, // quartInOut
            }).call(() => {
                this.showWinner(winner, callback);
            }, this).start();
        } else {
            this.playOnce(0, 5);
            this.action = tween(this.pointer)
                // .to(2, { angle: { value: -90, easing: "cubicIn" } })
                .by(12, {
                    angle: { value: -(360 * 60 + finalAngle), easing: "linear" },
                }).repeatForever().start();
        }
    }

    public isRun() {
        if (this.action)
            return this.action.running;
        return false;
    }


    private playOnce(startTime, endTime, loop = true) {
        if (this.audioSource && this.rollEffect) {
            this.audioSource.clip = this.rollEffect; // 设置音频片段
            this.audioSource.play(); // 播放音频

            // 在指定的时间后停止播放
            this.audioSource.scheduleOnce(() => {
                this.audioSource.stop(); // 停止播放
                if (loop)
                    this.startLoop(5, 7); // 开始循环播放 5 到 8 秒
            }, endTime - startTime);
        }
    }

    private startLoop(startTime, endTime) {
        if (this.audioSource && this.rollEffect) {
            this.audioSource.clip = this.rollEffect; // 重新设置音频片段
            this.audioSource.currentTime = startTime;
            this.audioSource.play(); // 播放音频

            // 监听音频播放
            this.audioSource.schedule(() => {
                const currentTime = this.audioSource.currentTime;
                // 设置当前播放时间为循环的开始时间
                if (currentTime >= endTime) {
                    this.audioSource.stop(); // 超过结束时间停止播放
                    this.audioSource.currentTime = startTime; // 重置时间
                    this.audioSource.play(); // 重新播放
                }
            }, 0, macro.REPEAT_FOREVER); // 立即开始，每帧检查
        }
    }

    // Play the last sound effect
    private playLast() {
        if (this.audioSource && this.rollEffect) {
            this.audioSource.unscheduleAllCallbacks();
            this.audioSource.stop();
            this.audioSource.clip = this.rollEffect; // 重新设置音频片段
            this.audioSource.currentTime = 7;
            this.audioSource.play(); // 播放音频
        }
    }
}

