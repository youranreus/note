/**
 * @author 季悠然
 * @date 2022-04-11
 */

import {useEffect, useState} from "react";
import {Card} from '@douyinfe/semi-ui';
import axios from "axios";
import {useHistory} from "react-router-dom";

function NoteItem(props) {
    const {type, nid} = props
    const {Meta} = Card
    const his = useHistory()
    const [data, setData] = useState('加载中')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (type === 'local') {
            setData(localStorage.getItem(nid))
            setLoading(false)
        } else {
            axios.get('https://i.exia.xyz/note/get/' + nid)
                .then(res => {
                    setData(res.data.content.content)
                    setLoading(false)
                })
        }
    }, [nid, type])

    const jump = () => {
        his.push('/' + (type === 'online' ? 'o/' : 'l/') + nid)
    }

    return (
        <Card
            loading={loading} className={"item"}
        >
            <Meta
                title={nid}
            />
            <p onClick={jump}>{data}</p>
        </Card>
    );
}

export default NoteItem