import React from 'react';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Movies: ['JOJO', 'Gundam', 'EVA']
        }
    }

    render() {
        return (
            <div className="App">
                <h2>yo</h2>
            </div>
        );
    }
}

export default App;
