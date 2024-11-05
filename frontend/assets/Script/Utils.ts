import { tween, v3, Node } from "cc";

export default {
    dialogShow(node: Node, mask: Node, y = -50, callback?: Function) {
        node.active = true;
        mask.active = true;
        tween(node).to(0.3, { position: v3(0, y) }).call(() => {
            if (callback)
                callback();
        }).start();
    },

    dialogHide(node: Node, mask: Node, y = 50, callback?: Function) {

        tween(node).to(0.1, { position: v3(0, y) }).call(() => {
            if (callback)
                callback();
            node.active = false;
            mask.active = false;
        }).start();
    },

    truncation(str: string, max: number): string {
        if (str.length >= max) {
            return str.substring(0, max - 3) + "...";
        }
        return str;
    }
}