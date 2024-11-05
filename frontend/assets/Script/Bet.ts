import { _decorator, Color, Component, Label, Node, Sprite, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import config from './config';

import nearAPI from "./near-api-cocos.min.js";
const { parseNearAmount } = nearAPI;

@ccclass('Bet')
export class Bet extends Component {

    @property({ type: Label })
    private bets: Label = null;

    @property({ type: Label })
    private winRate: Label = null;

    @property({ type: Node })
    private myColor: Node = null;


    start() {

    }

    update(deltaTime: number) {

    }

    public doBet(bet: number, account: string, wallet) {
        console.log("bet:", bet, "account:", account);
        let amount = parseNearAmount(bet.toString());
        console.log("amount:", amount)
        if (wallet && amount) {
            wallet.viewMethod({
                contractId: config.gameContract,
                method: "user_exists",
                args: { account_id: account }
            }).then((exists: boolean) => {
                console.log("exists:", exists);
                if (!exists) {
                    amount = parseNearAmount((bet + 0.01).toString());  // 0.01为存储成本,中在第一次调用时支付
                }
                wallet.callMethod({ contractId: config.gameContract, method: "dobet", deposit: amount }).then((result) => {
                    console.log("result:", result);
                });
            });

        }
    }

    public show(bets: number, win_rate: number, player: any) {
        // console.log("bets:", bets);
        this.bets.string = bets.toString()
        let wr = win_rate * 100;
        if (Number.isInteger(wr)) {
            this.winRate.string = wr.toString();
        } else {
            this.winRate.string = (win_rate * 100).toFixed(2);
        }

        if (bets) {
            let pw = this.getComponent(UITransform).width;
            this.myColor.getComponent(UITransform).width = win_rate * pw;
            this.myColor.getComponent(Sprite).color = Color.WHITE.fromHEX(config.colors[player.id]);
            this.node.active = true;
        } else {
            this.node.active = false;
        }
    }
}

