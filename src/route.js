/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from "react";
import {Redirect} from "react-router-dom";
import Entry from "./pages/Entry.js";
import Local from "./pages/Local.js";
import Online from "./pages/Online.js";

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