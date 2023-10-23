/**
 * @author 季悠然
 * @date 2021-12-10
 */
import React from 'react'
import { Route } from 'react-router-dom'
import Entry from './pages/Entry.js'
import Local from './pages/Local.js'
import Online from './pages/Online.js'
import Redirect from './components/Redirect.js'

const route = [
  {
    path: '/',
    element: <Entry />,
    exact: true,
  },
  {
    path: '/l/:id',
    element: <Local />,
  },
  {
    path: '/o/:id',
    element: <Online />,
  },
  {
    path: '/:id',
    element: <Redirect />,
  },
]

export function renderRoutes(routes) {
  return routes.map((item) => {
    return (
      <Route path={item.path} element={item.element} key={item.path}>
        {item.children && renderRoutes(item.children)}
      </Route>
    )
  })
}

export default route
