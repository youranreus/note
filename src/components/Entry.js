/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from 'react';
import {Empty, Button, Input, Collapsible} from '@douyinfe/semi-ui';
import { IconPlus,IconSearch } from '@douyinfe/semi-icons';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';

class Entry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            goto: '',
            isOpen: false
        }
    }

    render() {
        return (
            <div className="entry">
                <div>
                    <Empty
                        image={<IllustrationNoContent style={{width: 150, height: 150}} />}
                        darkModeImage={<IllustrationNoContentDark style={{width: 150, height: 150}} />}
                        title="季悠然の便签本"
                    >
                        <div style={{textAlign: "center"}}>
                            <Button icon={<IconPlus />} style={{ margin: 12 }} theme="solid" type="primary">
                                撕一张
                            </Button>
                            <Button icon={<IconSearch />} style={{ margin: 12 }} type="primary" onClick={()=>{this.setState({isOpen: !this.state.isOpen})}}>
                                找一张
                            </Button>
                            <br/>
                            <Collapsible isOpen={this.state.isOpen}>
                                <Input placeholder={"便签ID（回车跳转）"}/>
                            </Collapsible>
                        </div>
                    </Empty>
                </div>
            </div>
        );
    }
}

export default Entry;