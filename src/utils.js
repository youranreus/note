/**
 * @author 季悠然
 * @date 2022-04-12
 */

import copy from "copy-to-clipboard";
import {Toast} from "@douyinfe/semi-ui";

const randomString = (s) => {
    s = s || 32;
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "",
        i = 0;
    for (; i < s; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n;
}

const copyContent = (content) => {
    copy(content);
    Toast.info('复制成功');
}

export {
    randomString,
    copyContent
}