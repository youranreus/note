/**
 * @author 季悠然
 * @date 2021-12-10
 */
import Entry from "./components/Entry.js";
import Local from "./components/Local.js";

const route = [
    {
        path: '/',
        component: Entry,
        exact: true
    },
    {
        path: '/l/:id',
        component: Local
    }
];

export default route;