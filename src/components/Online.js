/**
 * @author 季悠然
 * @date 2021-12-11
 */
import React from 'react';
import {TextArea, Typography, Tag, Space, ButtonGroup, Button, Toast, Input, Collapsible} from '@douyinfe/semi-ui';
import copy from "copy-to-clipboard";
import axios from "axios";
import qs from 'qs';
import {withRouter} from "react-router-dom";

class Online extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: props.match.params.id,
            content: '加载中',
            key: '',
            lock: false,
            deleteVisible: false,
            lockVisible: false
        }
    }

    componentDidMount() {
        let that = this;
        axios.get('https://i.exia.xyz/note/get/'+this.state.id)
            .then(data=>{
                if(Array.isArray(data.data)) {
                    that.setState({
                        content: data.data[0].content,
                        lock: data.data[0].lock
                    });
                }
                else
                {
                    that.setState({
                        content: data.data.content,
                        lock: data.data.lock
                    });
                }

            })
    }

    save = () => {
        Toast.success('保存成功');
    }

    update = ()=>{
        axios.post('https://i.exia.xyz/note/modify/'+this.state.id+'?key='+this.state.key, qs.stringify({content: this.state.content}))
            .then(data=>{
                if(data.data.msg)
                    Toast.error(data.data.msg);
                else {
                    if(this.state.lock === false && this.state.key !== '') {
                        this.setState({
                            lock: true,
                            lockVisible: false
                        });
                        Toast.success('加密成功');
                    }
                    else {
                        Toast.success('更新成功');
                    }

                }
            });
    }

    showLock = () => {
        this.setState({
            lockVisible: !this.state.lockVisible
        });
    }

    showDelete = () => {
        this.setState({
            deleteVisible: !this.state.deleteVisible
        });
    }

    copyContent = ()=>{
        copy(this.state.content);
        Toast.info('复制成功');
    }

    copyUrl = ()=>{
        copy(window.location.href);
        Toast.info('链接已复制');
    }

    delete = ()=>{
        let OnlineArr = localStorage.getItem('onlineArr').split(",");

        axios.get('https://i.exia.xyz/note/delete/'+this.state.id+'?key='+this.state.key)
            .then(data=>{
                if(data.data.msg)
                    Toast.error(data.data.msg);
                else {
                    OnlineArr.splice(OnlineArr.indexOf(this.state.id),1);
                    localStorage.setItem("onlineArr", OnlineArr.join(","));
                    Toast.success('删除成功');
                }
            });
        this.props.history.push('/');
    }

    render() {
        const {Title} = Typography;
        return (
            <div className="Online">
                <div className={"Online-header"}>
                    <Title heading={1}>#{this.state.id}</Title>
                    <Space>
                        <Tag size={"large"} color={"green"}>在线便签</Tag>
                        <Tag size={"large"} color={"violet"}>len: {this.state.content.length}</Tag>
                        <Tag size={"large"} color={"red"}>{this.state.lock ? 'locked' : 'unlock'}</Tag>
                    </Space>
                </div>
                <TextArea rows={30} value={this.state.content} onChange={(v)=>this.setState({content: v})}/>
                <div style={{textAlign: "right", marginTop: "1rem"}}>
                    <Collapsible isOpen={this.state.lockVisible}>
                        <Input value={this.state.key} onChange={v=>this.setState({key: v})} placeholder={"密钥"} style={{maxWidth: 200, marginRight: "1rem"}}/>
                        <Button onClick={this.update}>send</Button>
                    </Collapsible>
                    <Collapsible isOpen={this.state.deleteVisible}>
                        <Input value={this.state.key} onChange={v=>this.setState({key: v})} placeholder={"密钥"} style={{maxWidth: 200, marginRight: "1rem"}}/>
                        <Button type={"danger"} onClick={this.delete}>delete</Button>
                    </Collapsible>
                    <br/>
                    <ButtonGroup>
                        <Button onClick={this.state.lock ? this.showLock : this.update}>保存</Button>
                        <Button onClick={this.copyContent}>复制</Button>
                        <Button onClick={this.copyUrl}>分享</Button>
                        {!this.state.lock?<Button onClick={this.showLock}>上锁</Button>:''}
                        <Button type={"danger"} onClick={this.state.lock ? this.showDelete : this.delete}>删除</Button>
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

export default withRouter(Online);