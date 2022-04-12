/**
 * @author 季悠然
 * @date 2022-04-12
 */
import {useHistory, useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {Button, ButtonGroup, Collapsible, Input, Space, Tag, TextArea, Toast, Typography} from "@douyinfe/semi-ui";
import qs from "qs";
import {copyContent, randomString} from "../utils";
import {IconChevronLeft, IconCopy, IconCopyAdd, IconDelete, IconLink, IconLock, IconSave} from "@douyinfe/semi-icons";

function Online() {
    const params = useParams()
    const his = useHistory()
    const {Title} = Typography
    const [nid, setNID] = useState(params.id)
    const [content, setContent] = useState('加载中')
    const [key, setKey] = useState('')
    const [lock, setLock] = useState(false)
    const [deleteVisible, setDeleteVisible] = useState(false)
    const [lockVisible, setlockVisible] = useState(false)

    useEffect(() => {
        let onlineArr = null;
        if (localStorage.getItem('onlineArr') != null) {
            onlineArr = localStorage.getItem('onlineArr').split(",").filter((item) =>item !== '')

            if (onlineArr.indexOf(nid + '') === -1) {
                onlineArr.push(nid + '')
                localStorage.setItem('onlineArr', onlineArr.join(','))
            }
        } else {
            localStorage.setItem('onlineArr', [nid].join(','))
        }

        axios.get('https://i.exia.xyz/note/get/' + nid)
            .then(data => {
                setContent(data.data.content.content)
                setLock(data.data.content.lock)
            })
    }, [nid])

    const update = () => {
        axios.post('https://i.exia.xyz/note/modify/' + nid + '?key=' + key, qs.stringify({content}))
            .then(data => {
                if (data.data.msg)
                    Toast.error(data.data.msg)
                else {
                    if (lock === false && key !== '') {
                        setLock(true)
                        setlockVisible(false)
                        Toast.success('加密成功')
                    } else {
                        setlockVisible(false)
                        Toast.success('更新成功')
                    }
                }
            })
            .catch((error) => {
                Toast.error(error.response.data.code + ': ' + error.response.data.msg)
            });
    }

    const showLock = () => {
        setlockVisible(!lockVisible)
        setDeleteVisible(false)
    }

    const showDelete = () => {
        setlockVisible(false)
        setDeleteVisible(!deleteVisible)
    }

    const copyNew = () => {
        let newId = randomString(8)
        axios.get('https://i.exia.xyz/note/get/' + newId)
            .then(data => {
                if (data.data.content.id === newId) {
                    axios.post('https://i.exia.xyz/note/modify/' + newId + '?key=', qs.stringify({content}))
                        .then(data => {
                            if (data.data.content === 1 || data.data.content === 0) {
                                Toast.success('转存成功');
                                setNID(newId)
                                setLock(false)
                                his.push('/o/' + newId)
                            } else {
                                console.log(data)
                                Toast.error("转存失败")
                            }
                        })
                } else {
                    console.log(data);
                    Toast.error("转存失败")
                }
            })
    }

    const del = () => {
        let OnlineArr = localStorage.getItem('onlineArr').split(",")

        axios.get('https://i.exia.xyz/note/delete/' + nid + '?key=' + key)
            .then(data => {
                if (data.data.msg)
                    Toast.error(data.data.msg)
                else {
                    OnlineArr.splice(OnlineArr.indexOf(nid), 1)
                    localStorage.setItem("onlineArr", OnlineArr.join(","))
                    Toast.success('删除成功')
                    his.push('/')
                }
            })
            .catch((error) => {
                Toast.error(error.response.data.code + ': ' + error.response.data.msg)
            });
    }

    const quickSave = (e) => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (!lock || (key && lock))
                update()
            else
                Toast.info('请先输入密钥')
        }
    }

    return (
        <div className="Online">
            <div className={"Online-header"}>
                <Title heading={1}>#{nid}</Title>
                <Space>
                    <Tag size={"large"} color={"green"}>在线便签</Tag>
                    <Tag size={"large"} color={"violet"}>len: {content.length}</Tag>
                    <Tag size={"large"} color={"red"}>{lock ? 'locked' : 'unlock'}</Tag>
                    <Button icon={<IconChevronLeft/>} size={"small"} onClick={() => {
                        his.push('/');
                    }}/>
                </Space>
            </div>
            <TextArea onKeyDown={quickSave} rows={30} value={content}
                      onChange={(v) => {setContent(v)}}/>
            <div style={{textAlign: "right", marginTop: "1rem"}}>
                <Collapsible isOpen={lockVisible}>
                    <div onKeyDown={e => {
                        if (e.keyCode === 13) update()
                    }}>
                        <Input value={key} onChange={v => {setKey(v)}} placeholder={"密钥"}
                               style={{maxWidth: 200, marginRight: "1rem"}}/>
                        <Button onClick={update}>send</Button>
                    </div>
                </Collapsible>
                <Collapsible isOpen={deleteVisible}>
                    <div onKeyDown={e => {
                        if (e.keyCode === 13) del()
                    }}>
                        <Input value={key} onChange={v => setKey(v)} placeholder={"密钥"}
                               style={{maxWidth: 200, marginRight: "1rem"}}/>
                        <Button type={"danger"} onClick={del}>删除</Button>
                    </div>
                </Collapsible>
                <br/>
                <ButtonGroup>
                    <Button onClick={lock ? showLock : update} icon={<IconSave/>}/>
                    <Button onClick={()=>{copyContent(content)}} icon={<IconCopy/>}/>
                    <Button onClick={copyNew} icon={<IconCopyAdd/>}/>
                    <Button onClick={()=>{copyContent(window.location.href)}} icon={<IconLink/>}/>
                    {!lock ? <Button onClick={showLock} icon={<IconLock/>}/> : ''}
                    <Button type={"danger"} onClick={lock ? showDelete : del}
                            icon={<IconDelete/>}/>
                </ButtonGroup>
            </div>
        </div>
    )
}

export default Online