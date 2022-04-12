/**
 * @author 季悠然
 * @date 2022-04-11
 */

import {useState} from "react";
import { Card } from '@douyinfe/semi-ui';

function NoteItem(props) {
    const {type, nid} = props
    const { Meta } = Card

    const [loading, setLoading] = useState(true);

    return (
        <Card
            loading={ loading }
        >
            <Meta
                title="Semi Doc"
                description="全面、易用、优质"
            />
        </Card>
    );
}

export default NoteItem