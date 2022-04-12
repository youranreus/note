/**
 * @author 季悠然
 * @date 2022-04-12
 */

import {Button, ButtonGroup, Space, Tag, TextArea, Toast, Typography} from "@douyinfe/semi-ui";
import {Redirect, useHistory, useParams} from "react-router-dom";
import {IconChevronLeft, IconCopy, IconDelete, IconSave, IconUpload} from "@douyinfe/semi-icons";
import {useState} from "react";
import {copyContent, randomString} from "../utils";
import axios from "axios";
import qs from "qs";

function Local() {
    const {Title} = Typography;
    const params = useParams()
    const his = useHistory()
    const [nid, setNID] = useState(params.id)
    const [content, setContent] = useState(localStorage.getItem(params.id))

    const save = () => {
        localStorage.setItem(nid, content);
        Toast.success('保存成功');
    }

    const quickSave = (e) => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
        }
    }

    const upload = () => {
        let newId = randomString(6);
        axios.get('https://i.exia.xyz/note/get/' + newId)
            .then(data => {
                if (data.data.content.id === newId) {
                    axios.post('https://i.exia.xyz/note/modify/' + newId + '?key=', qs.stringify({content}))
                        .then(data => {
                            if (data.data.content === 1 || data.data.content === 0) {
                                Toast.success('上传成功');
                                his.push('/o/' + newId);
                            } else {
                                console.log(data);
                                Toast.error("上传失败");
                            }
                        });
                } else
                    Toast.error("上传失败");
            })
    }

    const del = () => {
        let localArr = localStorage.getItem('localArr').split(",");
        localArr.splice(localArr.indexOf(this.state.id), 1);
        localStorage.removeItem(nid);
        localStorage.setItem("localArr", localArr.join(","));
        Toast.success('删除成功');
        his.push('/');
    }

    if (!localStorage.getItem(params.id)) {
        Toast.error('好像没有这张便签噢');
        localStorage.removeItem(params.id);
        return (<Redirect to={'/'}/>)
    }

    return (
        <div className="local">
            <div className={"local-header"}>
                <Title heading={1}>#{nid}</Title>
                <Space>
                    <Tag size={"large"} color={"blue"}>本地便签</Tag>
                    <Tag size={"large"} color={"violet"}>len: {content.length}</Tag>
                    <Button icon={<IconChevronLeft/>} size={"small"} onClick={() => {
                        his.push('/');
                    }}/>
                </Space>
            </div>
            <TextArea rows={30} onKeyDown={quickSave} value={content} onChange={(v) => {
                setContent(v)
            }}/>
            <div style={{textAlign: "right", marginTop: "1rem"}}>
                <ButtonGroup>
                    <Button onClick={save} icon={<IconSave/>}/>
                    <Button onClick={() => {
                        copyContent(content)
                    }} icon={<IconCopy/>}/>
                    <Button onClick={upload} icon={<IconUpload/>}/>
                    <Button type={"danger"} onClick={del} icon={<IconDelete/>}/>
                </ButtonGroup>
            </div>
        </div>
    );
}

export default Local