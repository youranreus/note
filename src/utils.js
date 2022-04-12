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

const addLike = (type, id) => {
    let likes = JSON.parse(localStorage.getItem('liked_note') || "[]")
    if(likes.findIndex(e => e.id === id && e.type === type) !== -1) {
        Toast.info('已经添加过咯')
    }
    else {
        likes.push({type: type, id: id})
        localStorage.setItem('liked_note', JSON.stringify(likes))
        Toast.success('添加成功')
    }
}

const delLike = (type, id) => {
    let likes = JSON.parse(localStorage.getItem('liked_note') || "[]")
    let index = likes.findIndex(e => e.id === id && e.type === type)
    if(index === -1) {
        Toast.info('没有收藏过这个噢')
    }
    else {
        likes.splice(index, 1)
        localStorage.setItem('liked_note', JSON.stringify(likes))
        Toast.success('删除成功')
    }
}

const isLiked = (type, id) => {
    return JSON.parse(localStorage.getItem('liked_note') || "[]").findIndex(e => e.id === id && e.type === type) !== -1
}

export {
    randomString,
    copyContent,
    addLike,
    isLiked,
    delLike
}