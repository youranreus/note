/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from 'react';
import {Empty, Button, Input, Collapsible, Card, RadioGroup, Radio, Typography} from '@douyinfe/semi-ui';
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
            }
        }
    }

    jump = (e) => {
        alert("Jumping to " + e.target.value);
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
            this.addLocal();
    }

    addOnline = () => {

    }

    addLocal = () => {
        //获取当前本地便签清单
        let localArr = localStorage.getItem("localArr").split(",");

        //生成新便签id并添加进入本地便签清单
        let newNoteId = this.randomString(5);
        localArr.push(newNoteId);

        //更新便签localStorage储存
        localStorage.setItem("localArr", localArr.join(","));
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
    }

    render() {
        const {Title} = Typography;
        return (
            <div className="entry">
                <div>
                    <Empty
                        image={<IllustrationNoContent style={{width: 150, height: 150}}/>}
                        darkModeImage={<IllustrationNoContentDark style={{width: 150, height: 150}}/>}
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
                                <Input placeholder={"便签ID（回车跳转）"} onEnterPress={this.jump}/>
                            </Collapsible>
                            <Collapsible isOpen={this.state.addFlag}>
                                <Card className={"addNote"}>
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
                                </Card>
                            </Collapsible>
                        </div>
                    </Empty>
                </div>
            </div>
        );
    }
}

export default Entry;