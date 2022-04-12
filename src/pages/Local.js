/**
 * @author 季悠然
 * @date 2021-12-11
 */
import React from 'react';
import {TextArea, Typography, Tag, Space, ButtonGroup, Button, Toast} from '@douyinfe/semi-ui';
import copy from "copy-to-clipboard";
import {Redirect, withRouter} from "react-router-dom";
import {IconChevronLeft, IconCopy, IconDelete, IconSave, IconUpload} from "@douyinfe/semi-icons";
import axios from "axios";
import qs from "qs";

class Local extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: props.match.params.id,
            content: localStorage.getItem(props.match.params.id),
            deleteVisible: false
        }
    }

    save = () => {
        localStorage.setItem(this.state.id, this.state.content);
        Toast.success('保存成功');
    }

    copyContent = () => {
        copy(this.state.content);
        Toast.info('复制成功');
    }

    randomString = (s) => {
        s = s || 32;
        let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
            a = t.length,
            n = "",
            i = 0;
        for (; i < s; i++) n += t.charAt(Math.floor(Math.random() * a));
        return n;
    }

    upload = ()=>{
        let newId = this.randomString(6);
        axios.get('https://i.exia.xyz/note/get/'+newId)
            .then(data=>{
                if(data.data.content.id === newId) {
                    axios.post('https://i.exia.xyz/note/modify/' + newId + '?key=', qs.stringify({content: this.state.content}))
                        .then(data => {
                            if (data.data.content === 1 || data.data.content === 0) {
                                Toast.success('上传成功');
                                this.props.history.push('/o/' + newId);
                            } else {
                                console.log(data);
                                Toast.error("上传失败");
                            }
                        });
                }
                else
                    Toast.error("上传失败");
            })
    }

    delete = ()=>{
        let localArr = localStorage.getItem('localArr').split(",");
        localArr.splice(localArr.indexOf(this.state.id),1);
        localStorage.removeItem(this.state.id);
        localStorage.setItem("localArr", localArr.join(","));
        Toast.success('删除成功');
        this.props.history.push('/');
    }

    quickSave = (e)=>{
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.save();
        }
    }

    render() {
        const {Title} = Typography;
        if(!localStorage.getItem(this.props.match.params.id)) {
            Toast.error('好像没有这张便签噢');
            localStorage.removeItem(this.props.match.params.id);
            return (<Redirect to={'/'}/>);
        }

        return (
            <div className="local">
                <div className={"local-header"}>
                    <Title heading={1}>#{this.state.id}</Title>
                    <Space>
                        <Tag size={"large"} color={"blue"}>本地便签</Tag>
                        <Tag size={"large"} color={"violet"}>len: {this.state.content.length}</Tag>
                        <Button icon={<IconChevronLeft />} size={"small"} onClick={()=>{this.props.history.push('/');}}/>
                    </Space>
                </div>
                <TextArea rows={30} onKeyDown={this.quickSave} value={this.state.content} onChange={(v)=>this.setState({content: v})}/>
                <div style={{textAlign: "right", marginTop: "1rem"}}>
                    <ButtonGroup>
                        <Button onClick={this.save} icon={<IconSave />}/>
                        <Button onClick={this.copyContent} icon={<IconCopy />}/>
                        <Button onClick={this.upload} icon={<IconUpload />}/>
                        <Button type={"danger"} onClick={this.delete} icon={<IconDelete />}/>
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

export default withRouter(Local);