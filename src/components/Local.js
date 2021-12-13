/**
 * @author 季悠然
 * @date 2021-12-11
 */
import React from 'react';
import {TextArea, Typography, Tag, Space, ButtonGroup, Button, Toast} from '@douyinfe/semi-ui';
import copy from "copy-to-clipboard";
import {Redirect, withRouter} from "react-router-dom";
import {IconChevronLeft, IconCopy, IconDelete, IconSave, IconUpload} from "@douyinfe/semi-icons";

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

    copyContent = ()=>{
        copy(this.state.content);
        Toast.info('复制成功');
    }

    upload = ()=>{
        Toast.error('还没有开发完成噢');
    }

    delete = ()=>{
        let localArr = localStorage.getItem('localArr').split(",");
        localArr.splice(localArr.indexOf(this.state.id),1);
        localStorage.removeItem(this.state.id);
        localStorage.setItem("localArr", localArr.join(","));
        Toast.success('删除成功');
        this.props.history.push('/');
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
                <TextArea rows={30} value={this.state.content} onChange={(v)=>this.setState({content: v})}/>
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