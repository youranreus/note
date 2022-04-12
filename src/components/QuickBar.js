/**
 * @author 季悠然
 * @date 2022-04-12
 */
import {useEffect, useState} from "react";
import {Tabs, TabPane, CardGroup} from '@douyinfe/semi-ui';
import {IconChevronUpDown, IconStar, IconHistory} from '@douyinfe/semi-icons';
import NoteItem from "../components/NoteItem.js";

export default function QuickBar(props) {
    const [display, setDisplay] = useState(false)
    const {onlineHis, localHis} = props
    const [likes, setLikes] = useState([])

    useEffect(() => {
        setLikes(JSON.parse(localStorage.getItem('liked_note')) || "[]")
    }, [])

    return (
        <div className={["QuickBar", (display ? "open" : " ")].join(' ')}>
            <div className={"switch"} onClick={() => {setDisplay(!display)}}>
                <IconChevronUpDown size={"extra-large"}/>
            </div>

            <Tabs type="button">
                <TabPane tab={<span><IconStar/>收藏</span>} itemKey="like">
                    <div className="content">
                        <CardGroup spacing={15}>
                            {
                                likes.map(item => (
                                    <NoteItem type={item.type} nid={item.id} key={item.id}/>
                                ))
                            }
                        </CardGroup>
                    </div>
                </TabPane>
                <TabPane tab={<span><IconHistory/>本地历史</span>} itemKey="local">
                    <div className="content">
                        <CardGroup spacing={15}>
                            {
                                localHis.map(item => (
                                    <NoteItem type={"local"} nid={item} key={item}/>
                                ))
                            }
                        </CardGroup>
                    </div>
                </TabPane>
                <TabPane tab={<span><IconHistory/>在线历史</span>} itemKey="online">
                    <div className="content">
                        <CardGroup spacing={15}>
                            {
                                onlineHis.map(item => (
                                    <NoteItem type={"online"} nid={item} key={item}/>
                                ))
                            }
                        </CardGroup>
                    </div>
                </TabPane>
            </Tabs>
        </div>
    )
}