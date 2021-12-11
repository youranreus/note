/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from 'react';
import {Toast, Empty, Button, Input, Collapsible, RadioGroup, Radio, Typography, InputGroup, Select, AutoComplete} from '@douyinfe/semi-ui';
import {IconPlus, IconSearch} from '@douyinfe/semi-icons';
import {IllustrationNoContent, IllustrationNoContentDark} from '@douyinfe/semi-illustrations';

class Entry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            goto: '',
            findFlag: false,
            addFlag: false,
            newNote: {
                mode: 'online',
                key: '',
                lock: ''
            },
            jumpMode: 'local',
            jumpId: '',
            onlineArr: [],
            localArr: []
        }
    }

    jump = () => {
        if(this.state.jumpId === '')
            Toast.warning({content:'ID呐？'});
        else
            alert("Jumping to " + this.state.jumpId);
    }

    switchMode = (e) => {
        this.setState({
            newNote: {
                mode: e.target.value
            }
        });
    }

    add = () => {
        if (this.state.newNote.mode === 'local')
            this.addLocal();
        else
            this.addOnline();
    }

    addOnline = () => {
        let onlineData = this.state.onlineArr;
        //生成新便签id并添加进入本地便签清单
        let newNoteId = this.randomString(5);
        onlineData.push(newNoteId);

        this.setState({
            onlineArr: onlineData
        });

        //更新便签localStorage储存
        localStorage.setItem("onlineArr", onlineData.join(","));
    }

    addLocal = () => {
        //获取当前本地便签清单
        let localData = this.state.localArr;

        //生成新便签id并添加进入本地便签清单
        let newNoteId = this.randomString(5);
        localData.push(newNoteId);

        this.setState({
            localArr: localData
        });

        //更新便签localStorage储存
        localStorage.setItem("localArr", localData.join(","));
        localStorage.setItem(newNoteId, "Begin your story");
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

    componentDidMount() {
        if(localStorage.getItem('localArr') === null)
            localStorage.setItem("localArr", "");
        if(localStorage.getItem('onlineArr') === null)
            localStorage.setItem("onlineArr", "");
        this.setState({
            localArr: localStorage.getItem('localArr').split(",").filter((item)=>{
                return item !== ''
            }),
            onlineArr: localStorage.getItem('onlineArr').split(",").filter((item)=>{
                return item !== ''
            })
        });
    }

    render() {
        const {Title,Paragraph} = Typography;
        return (
            <div className="entry">
                <div>
                    <Empty
                        image={<IllustrationNoContent style={{width: 150, height: 150}}/>}
                        title="季悠然の便签本"
                    >
                        <div style={{textAlign: "center"}}>
                            <Button icon={<IconPlus/>} style={{margin: 12}} theme="solid" type="primary"
                                    onClick={() => {
                                        this.setState({addFlag: !this.state.addFlag, findFlag: false})
                                    }}>
                                撕一张
                            </Button>
                            <Button icon={<IconSearch/>} style={{margin: 12}} type="primary" onClick={() => {
                                this.setState({findFlag: !this.state.findFlag, addFlag: false})
                            }}>
                                找一张
                            </Button>
                            <br/>
                            <Collapsible isOpen={this.state.findFlag}>
                                <div>
                                    <InputGroup>
                                        <Select defaultValue='local' onSelect={(value)=>{this.setState({jumpMode: value})}}>
                                            <Select.Option value='online'>在线</Select.Option>
                                            <Select.Option value='local'>本地</Select.Option>
                                        </Select>
                                        <AutoComplete
                                            data={this.state.jumpMode === 'local' ? this.state.localArr : this.state.onlineArr}
                                            placeholder={"便签ID"}
                                            emptyContent={<Paragraph style={{padding: "6px 12px"}} >没有记录噢</Paragraph>}
                                            onChange={(v)=>this.setState({jumpId: v})}
                                        />
                                    </InputGroup>
                                    <div style={{textAlign: "right", marginTop: "1rem"}}>
                                        <Button type={"primary"} onClick={this.jump}>找一下</Button>
                                    </div>
                                </div>
                            </Collapsible>
                            <Collapsible isOpen={this.state.addFlag}>
                                <div className={"addNote"}>
                                    <Title heading={6} style={{margin: "0 0 .5rem"}}>
                                        标签类型
                                    </Title>
                                    <RadioGroup defaultValue={"online"} onChange={this.switchMode}>
                                        <Radio value={"local"}>本地便签</Radio>
                                        <Radio value={"online"}>在线便签</Radio>
                                    </RadioGroup>
                                    <Collapsible isOpen={this.state.newNote.mode === "online"}>
                                        <Title heading={6} style={{margin: "1rem 0 .5rem"}}>
                                            加密
                                        </Title>
                                        <Input placeholder={"密钥（留空则无加密）"}/>
                                    </Collapsible>
                                    <div style={{textAlign: "right", marginTop: "1rem"}}>
                                        <Button type={"primary"} onClick={this.add}>撕一张</Button>
                                    </div>
                                </div>
                            </Collapsible>
                        </div>
                    </Empty>
                </div>
            </div>
        );
    }
}

export default Entry;