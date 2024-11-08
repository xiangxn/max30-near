import { AudioSource, director } from "cc";
import BurstButton from "./BurstButton";
import { Game } from "./Game";

export class AudioManager {
    static setVolume(volume: number) {
        // 将所有音频的音量设置为指定的值
        const burstButton = director.getScene().getComponentsInChildren(BurstButton);
        burstButton.forEach(bb => {
            bb.setVolume(volume);
        });

        let game = director.getScene().getChildByName("Canvas").getComponent(Game);
        game.setRollerVolume(volume);
    }

    static muteAll() {
        this.setVolume(0); // 静音
    }

    static unmuteAll() {
        this.setVolume(1); // 解除静音
    }
}