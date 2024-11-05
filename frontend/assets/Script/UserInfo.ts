import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('UserInfo')
export class UserInfo extends Component {
    @property(Node)
    public loginBtn = null;
    @property(Node)
    public headInfo = null;
    @property(Label)
    public nickname = null;
    @property(Label)
    public balance = null;
    @property(Node)
    public betPanel = null;
    @property(Label)
    public totalBet = null;
    @property(Label)
    public totalRate = null;
    @property(Node)
    public totalColor = null;
    @property(Label)
    public curBet = null;
    @property(Label)
    public curRate = null;

    private wallet;

    reset() {
        // this.betPanel.active = false; 
    }

    onLoad() {
        
    }

}