import { _decorator, Component, Label, Node, tween, sys, Sprite } from 'cc';
import { Roller } from './Roller';
import Config from './config';
const { ccclass, property } = _decorator;

import { AudioManager } from "./AudioManager";

import { l10n } from 'db://localization-editor/l10n';

import nearAPI from "./near-api-cocos.min.js";
import BurstButton from './BurstButton';
import { UserList } from './UserList';
import { Bet } from './Bet';
import Utils from './Utils';
const { Wallet, formatNearAmount, createHash } = nearAPI;



@ccclass('Game')
export class Game extends Component {

    @property({ type: Node })
    private toast: Node = null;

    @property({ type: Node })
    private dialog: Node = null;

    @property({ type: Roller })
    private roller: Roller = null;

    @property({ type: Node })
    private userList: Node = null;

    @property({ type: Node })
    private headInfo: Node = null;

    @property({ type: Node })
    private loginNode: Node = null;

    @property({ type: Bet })
    private myBet: Bet = null;

    @property({ type: Node })
    private betBtns: Node = null;

    @property({ type: Label })
    private totalBet: Label = null;

    @property({ type: Label })
    private clockTime: Label = null;

    @property({ type: Label })
    private balance: Label = null;

    @property({ type: BurstButton })
    private exitBtn: BurstButton = null;

    @property({ type: BurstButton })
    private soundBtn: BurstButton = null;

    private wallet: any = null;

    private players = [];

    private globalStatus = null;

    private currentAccount = null;

    private waitTimeValue: number = 0;

    onLoad() {
        let language: string;
        if (sys.language == "zh") {
            language = "zh-Hans-CN";
        } else {
            language = "en-US";
        }
        l10n.config({ fallbackLanguage: 'en-US', language });

        console.log("sys.language:", language, l10n.currentLanguage)

        if (l10n.currentLanguage != language) {
            l10n.changeLanguage(language);
        }

        this.soundBtn.setCallback((tag: string, event: string, ...parms: any[]) => {
            if (event === "Release") {
                let sprite = this.soundBtn.getComponent(Sprite);
                if (sprite.spriteFrame == sprite.spriteAtlas.getSpriteFrame("声音关")) {
                    sprite.spriteFrame = sprite.spriteAtlas.getSpriteFrame("声音");
                    AudioManager.unmuteAll();
                } else {
                    sprite.spriteFrame = sprite.spriteAtlas.getSpriteFrame("声音关");
                    AudioManager.muteAll();
                }
            }
        }, this);

        this.loginNode.getComponent(BurstButton).setCallback(this.login, this);
        this.wallet = new Wallet({ networkId: Config.NetworkId, createAccessKeyFor: Config.gameContract });
        this.betBtns.children.forEach((item, index) => {
            item.getComponent(BurstButton).setCallback((tag: string, event: string, ...parms: any[]) => {
                if (event === "Release") {
                    if (this.currentAccount) {
                        this.myBet.doBet(Config.bets[index], this.currentAccount, this.wallet);
                    } else {
                        this.wallet.signIn();
                    }
                }
            }, this);
        });
        this.exitBtn.setCallback((tag: string, event: string, ...parms: any[]) => {
            if (event === "Release") {
                this.logOut();
            }
        }, this);
        this.roller.reset();
    }

    protected start(): void {
        this.wallet.startUp((account) => {
            this.changeHook(account);
        }).then(() => {
            this.refreshGame();
        });
    }

    update(dt: any) {
    }

    private changeHook(account: any) {
        this.currentAccount = account;
        if (account) {
            this.loginNode.active = false;
            this.headInfo.active = true;
            let node = this.headInfo.getChildByName("Nickname");
            node.getComponent(Label).string = Utils.truncation(account, 20);
            this.getBalance(account);
        } else {
            this.loginNode.active = true;
            this.headInfo.active = false;
        }
    }

    private getBalance(account: string) {
        if (account) {
            this.wallet.viewAccount(account).then((data) => {
                console.log("account:", data);
                this.balance.string = formatNearAmount(data.amount, 4);
            }).catch((err) => { console.log(err) });
        }
    }

    private async logOut() {
        console.log('退出？？？', this.currentAccount);
        await this.wallet.signOut().catch(err => {
            console.log("logout:", err);
        });

    }

    private login(tag: any, event: String, ...parms: any) {
        if (event === "Press") {
            console.log('登录？？？', event, Config)
            this.wallet.signIn()
        }
    }

    private updateStatus() {
        let { status, wait_time, ready_time, lottery_time } = this.globalStatus;
        switch (status) {
            case "Init":
                // this.unschedule(this.refreshState);
                this.clockTime.string = "0";
                this.roller.hideClock();
                this.roller.showStatus(l10n.t("waiting_players"));
                this.schedule(this.refreshGame, 5);
                break;
            case "Wait":
                this.roller.showClock();
                this.roller.hideStatus();

                let wt = wait_time / 1000000000;        // wait_time的值为纳秒
                wt = wt - new Date().getTime() / 1000;  // getTime的值为毫秒
                this.waitTimeValue = Math.floor(wt);
                if (this.waitTimeValue > 0) {
                    this.unschedule(this.refreshGame);
                    this.schedule(this.refreshPlayers, 5);
                    this.waitTime();
                } else {
                    this.unschedule(this.refreshGame);
                    this.unschedule(this.refreshPlayers);
                    this.schedule(this.refreshState, 1);
                    if (this.roller.isRun() == false) {
                        this.roller.runRoller();
                    }
                }
                break;
            case "Ready":
                this.unschedule(this.refreshState);
                if (this.roller.isRun() == false) {
                    this.roller.runRoller();
                }
                this.procWinner();
                break;
        }
    }

    private refreshGame() {
        Promise.all([
            this.wallet.viewMethod({ contractId: Config.gameContract, method: "get_state" }),
            this.wallet.viewMethod({ contractId: Config.gameContract, method: "get_players" })
        ]).then(result => {
            console.log("refreshGame:", result)
            this.globalStatus = result[0];
            let { bet_total } = this.globalStatus;
            this.totalBet.string = parseFloat(formatNearAmount(bet_total)).toFixed(2);
            let count = result[1].length;
            if (count > 0) {
                this.players = result[1];
            } else {
                this.players = [];
            }

            this.updatePlayers();

            this.updateStatus()

        });
    }

    // p1,p2一样返回true,否则返回假
    private checkPlayers(p1, p2): boolean {
        if (p1.length == p2.length) {
            let h1 = createHash('sha1').update(JSON.stringify(p1)).digest('hex');
            let h2 = createHash('sha1').update(JSON.stringify(p2)).digest('hex');
            console.log("checkPlayers:", h1, h2)
            return h1 == h2;
        }
        return false;
    }

    private updatePlayers() {
        this.userList.getComponent(UserList).setPlayers(this.players);
        this.roller.setPlayers(this.players);

        let bet_total = 0;
        this.players.forEach((player) => {
            bet_total += parseFloat(formatNearAmount(player.bet));
        });
        this.totalBet.string = bet_total.toFixed(2);
        this.showBetNode();
    }

    // Refresh Player List
    private refreshPlayers() {
        this.wallet.viewMethod({ contractId: Config.gameContract, method: "get_players" }).then((players) => {
            console.log("refreshPlayers:", players)
            if (this.checkPlayers(this.players, players) == false) {
                this.players = players;
                this.updatePlayers();
            }
        });
    }

    // Refresh global status
    private refreshState() {
        this.wallet.viewMethod({ contractId: Config.gameContract, method: "get_state" }).then((state) => {
            console.log("refreshState:", state)
            if (this.globalStatus.status != state.status) {
                this.globalStatus = state;
                this.updateStatus();
            }
        });
    }

    // Show countdown
    private waitTime() {
        console.log("waitTime:", this.waitTimeValue)
        if (this.waitTimeValue <= 0) {
            this.unschedule(this.waitTime);
            this.unschedule(this.refreshGame);
            this.unschedule(this.refreshPlayers);
            if (this.roller.isRun() == false) {
                this.roller.runRoller();
            }
            this.schedule(this.refreshState, 1);
        } else {
            this.waitTimeValue -= 1;
            this.clockTime.string = this.waitTimeValue.toString();
            this.unschedule(this.waitTime);
            this.scheduleOnce(this.waitTime, 1);
        }
    }

    private showBetNode() {
        let bets = 0;
        let win_rate = 0;
        let player = this.players.find((val) => val.owner === this.currentAccount);
        if (player) {
            bets += parseFloat(formatNearAmount(player.bet))
            win_rate += player.win_rate;
        }
        this.myBet.show(bets, win_rate, player)
    }

    private procWinner() {
        this.wallet.viewMethod({ contractId: Config.gameContract, method: "get_winner" }).then(winner => {
            console.log("winner:", winner)
            if (winner) {
                this.unschedule(this.procWinner);
                this.roller.runRoller(winner, () => {
                    // 结束后刷新游戏
                    this.schedule(this.refreshGame, 5);
                });
            } else {
                this.scheduleOnce(this.procWinner, 1);
            }
        });
    }

    public setRollerVolume(volume: number) {
        this.roller.setAudioVolume(volume);
    }
}