/**
 * @author 季悠然
 * @date 2022-04-11
 */

import { Navigate, useParams } from 'react-router-dom'

function Redirect() {
  const params = useParams()

  return <Navigate to={'/o/' + params.id} />
}

export default Redirect
