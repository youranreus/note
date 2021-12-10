import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom';
import {renderRoutes} from "react-router-config";
import route from "./route.js";
import './App.css';

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
                <Router>
                    {renderRoutes(route)}
                </Router>
            </div>
        );
    }
}

export default App;
