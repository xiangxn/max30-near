import { _decorator, Component, Label, Sprite, Color } from 'cc';
import config from './config';
const { ccclass, property } = _decorator;

import nearAPI from "./near-api-cocos.min.js";
import Utils from './Utils';

const { formatNearAmount } = nearAPI;

@ccclass('UserItem')
export class UserItem extends Component {

    @property({ type: Label })
    userName: Label = null;
    @property({ type: Sprite })
    userColor: Sprite = null;
    @property({ type: Label })
    userRate: Label = null;
    @property({ type: Label })
    userAmount: Label = null;
    @property({ type: Label })
    symbol: Label = null;

    start() {

    }

    update(deltaTime: number) {

    }

    public setPlayer(player) {
        let { id, owner, win_rate, bet } = player;
        this.userName.string = Utils.truncation(owner,14);
        Color.fromHEX(this.userColor.color, config.colors[id]);
        this.userRate.string = (win_rate * 100).toFixed(2).toString();
        this.userAmount.string = formatNearAmount(bet);
        this.symbol.string = config.symbol;
    }
}

