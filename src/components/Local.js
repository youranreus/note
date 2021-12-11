/**
 * @author 季悠然
 * @date 2021-12-11
 */
import React from 'react';
import {TextArea, Typography, Tag, Space, ButtonGroup, Button, Toast} from '@douyinfe/semi-ui';
import copy from "copy-to-clipboard";
import {withRouter} from "react-router-dom";

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
        return (
            <div className="local">
                <div className={"local-header"}>
                    <Title heading={1}>#{this.state.id}</Title>
                    <Space>
                        <Tag size={"large"} color={"blue"}>本地便签</Tag>
                        <Tag size={"large"} color={"violet"}>len: {this.state.content.length}</Tag>
                    </Space>
                </div>
                <TextArea rows={30} value={this.state.content} onChange={(v)=>this.setState({content: v})}/>
                <div style={{textAlign: "right", marginTop: "1rem"}}>
                    <ButtonGroup>
                        <Button onClick={this.save}>保存</Button>
                        <Button onClick={this.copyContent}>复制</Button>
                        <Button onClick={this.upload}>上传</Button>
                        <Button type={"danger"} onClick={this.delete}>删除</Button>
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

export default withRouter(Local);