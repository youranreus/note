/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from 'react';

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Movies: ['JOJO', 'Gundam', 'EVA']
        }
    }

    render() {
        return (
            <div className="main">
                <h2>yo!</h2>
            </div>
        );
    }
}

export default Main;