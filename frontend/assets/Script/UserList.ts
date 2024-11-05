import { _decorator, Component, instantiate, Label, Node, Prefab, UITransform } from 'cc';
import BurstButton from './BurstButton';
import { UserItem } from './UserItem';
import Utils from './Utils';
const { ccclass, property } = _decorator;

@ccclass('UserList')
export class UserList extends Component {

    @property({ type: Node })
    dialogMask: Node = null;

    @property({ type: Prefab })
    userItem: Prefab = null;

    @property({ type: Node })
    userContainer: Node = null;

    @property({ type: Label })
    mainUserCount: Label = null;

    @property({ type: Label })
    userCount: Label = null;

    @property({ type: BurstButton })
    closeBtn: BurstButton = null;

    private players = [];

    protected onLoad(): void {
        this.closeBtn.setCallback((tag: string, event: string, ...parms: any[]) => {
            this.close();
        }, this);
    }

    start() {

    }

    update(deltaTime: number) {

    }

    public setPlayers(players) {
        this.players = players;
        this.userContainer.removeAllChildren();
        this.mainUserCount.string = this.userCount.string = this.players.length.toString();
        this.players.forEach(p => {
            let item = instantiate(this.userItem);
            item.getComponent(UserItem).setPlayer(p);
            this.userContainer.addChild(item);
        })
    }

    public show() {
        if (this.players.length > 0)
            Utils.dialogShow(this.node, this.dialogMask, -30);
    }

    public close() {
        Utils.dialogHide(this.node, this.dialogMask);
    }
}

