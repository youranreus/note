import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom';
import {renderRoutes} from "react-router-config";
import route from "./route.js";
import './App.css';
import {Button} from "@douyinfe/semi-ui";
import { IconSun } from '@douyinfe/semi-icons';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dark: false
        }
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        function matchMode(e) {
            const body = document.body;
            if (e.matches) {
                if (!body.hasAttribute('theme-mode')) {
                    body.setAttribute('theme-mode', 'dark');
                }
            } else {
                if (body.hasAttribute('theme-mode')) {
                    body.removeAttribute('theme-mode');
                }
            }
        }
        mql.addListener(matchMode);
    }

    switchMode = () => {
        const body = document.body;
        if (body.hasAttribute('theme-mode'))
            body.removeAttribute('theme-mode');
        else
            body.setAttribute('theme-mode', 'dark');
    }

    render() {
        return (
            <div className="App">
                <Router>
                    {renderRoutes(route)}
                </Router>
                <div className={"dark"}>
                    <Button icon={<IconSun />} onClick={this.switchMode}/>
                </div>
            </div>
        );
    }
}

export default App;
