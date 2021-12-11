/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from "react";
import {Redirect} from "react-router-dom";
import Entry from "./components/Entry.js";
import Local from "./components/Local.js";
import Online from "./components/Online.js";

const route = [
    {
        path: '/',
        component: Entry,
        exact: true
    },
    {
        path: '/l/:id',
        component: Local
    },
    {
        path: '/o/:id',
        component: Online
    },
    {
        path: '/:id',
        render: (props) => {
            return (
                <Redirect to={"/o/" + props.match.params.id}/>
            )
        }
    }
];

export default route;